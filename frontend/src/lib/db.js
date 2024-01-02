import * as idb from 'idb';

export class DB {

  constructor(name, version, tables) {
    this.name = name;
    this.tables = tables;
    this.version = version;
    this.db = idb.openDB(name, version, {
      upgrade: (db) => this.setup(db),
    });
    tables.forEach((table) => {
      this[table.collection || table.name.toLowerCase()] = new Table(this, table);
    });
  }

  destroy() {
    // TODO: this.db.destroy()
  }
  setup(db) {
    this.tables.forEach((table) => {
      let store = db.createObjectStore(table.name, {
        keyPath: table.id || 'id',
        autoIncrement: true,
      });
      // TODO: store.createIndex(field, type);
    });
  }

  promise_wrap(fn) {
    let res,rej,p;
    p = new Promise((resolve, reject) => { res = resolve; rej = reject });
    fn(res, rej)
    return p;
  }
  conn_wrap(fn) {
    return this.promise_wrap((res, rej) => {
      this.db.then((db) => {
        fn(db, res, rej);
      }).catch((err) => rej(err));
    });
  }
  simple_wrap(fn, args) {
    return this.conn_wrap((db,res,rej) => {
      db[fn](...args).then((r) => {
        res(r);
      }).catch((err) => rej(err));
    });
  }
}

function createTableEntry(table) {
  let cls = function(data) {
    this.data = data || {};
    this.table = table;
    this.conn = table.conn;
  };

  cls.prototype.save = function() {
    return this.conn.simple_wrap('put', [this.table.name, this.data]);
  };
  cls.prototype.destroy = function() {
    return this.conn.simple_wrap('delete', [this.table.name, this.data.id]);
  };

  table.table.attrs.forEach((attr) => {
    Object.defineProperty(cls.prototype, attr, {
      get: function() { return this.data[attr] },
      set: function(val) { this.data[attr] = val }
    });
  });

  return cls;
};

export class Table {
  constructor(conn, table) {
    this.conn = conn;
    this.table = table;
    this.name = table.name;
    this.entry_cls = createTableEntry(this);
  }

  all(opts) {
    if (!opts) opts = {};
    return this.conn.simple_wrap('getAll', [this.name]).then((r) => {
      let list = r.map((ent) => new this.entry_cls(ent));
      if (opts.filter) list = list.filter((entry) => opts.filter(entry));
      return list;
    });
  }
  create(data) {
    return this.conn.conn_wrap((db,res,rej) => {
      db.add(this.name, data).then((r) => {
        res(new this.entry_cls({id: r, ...data}));
      }).catch((err) => { rej(err) });
    });
  }

  find(id) {
    let res,rej,p;
    p = new Promise((resolve, reject) => {res = resolve; rej = reject});
    this.conn.db.then((db) => {
      db.get(this.name, id).then((r) => {
        res(new this.entry_cls(r));
      }).catch((err) => rej(err));
    }).catch((err) => rej(err));
    return p;
  }
}

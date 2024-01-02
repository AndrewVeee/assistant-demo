export class TreeStore {

  constructor(opts) {
    this.opts = opts || {};
    this.pid = opts.pid || 'pid';
    this.id_field = opts.id || 'id';
    this.roots = [];
    this.all_items = [];
    this.item_dict = {};
  }

  add_item(parent, child) {
    parent.children.push(this.item_struct(child));
  }
  remove_item(item) {
    if (item.parent) {
      let idx = item.parent.children.indexOf(item);
      if (idx !== -1) item.parent.children.splice(idx, 1);
    } else {
      let idx = this.roots.indexOf(item);
      if (idx !== -1) this.roots.splice(idx, 1);
    }
  }
  item_struct(item, p) {
    let new_item = {
      id: item[this.id_field],
      entry: item,
      children: [],
      parent: p,
    };
    new_item.add = this.add_item.bind(this, new_item);
    new_item.remove = this.remove_item.bind(this, new_item);
    return new_item;
  }
  add_children(p) {
    for (let item of this.all_items) {
      if (item[this.pid] == p.id) {
        let new_child = this.item_struct(item, p);
        p.children.push(new_child);
        this.add_children(new_child);
      }
    }
  }
  add_root(item) {
    this.roots.push(this.item_struct(item, null));
  }
  init(item_list) {
    this.all_items = item_list;
    this.item_dict = {};
    this.roots = [];

    for (let item of item_list) {
      this.item_dict[item[this.id_field]] = item;
      if (!item[this.pid]) {
        this.roots.push(this.item_struct(item, null));
      }
    }
    this.roots.forEach((root) => { this.add_children(root) });
  }

}

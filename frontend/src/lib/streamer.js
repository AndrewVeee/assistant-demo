export function DataParser(line, parse_json) {
  let result = {}, match;
  if (line == '') {
    return {empty: true, text: ''};
  }
  if (match = /^data: (.*)$/.exec(line)) {
    if (parse_json)
      result.json = JSON.parse(match[1]);
    else
      result.text = match[1]
  } else {
    result.error = 'No data header';
    result.line = line;
  }
  return result;
}
export class LineStream {
  constructor(path, req, opts) {
    if (!opts) opts = {};
    this.path = path;
    this.req = req;
    this.current = '';
    this.on_line = null;
    this.on_done = null;
    this.opts = opts;
  }

  parse_lines(chunk, is_done) {
    let nl = chunk.indexOf("\n"), pos=0, count = 0;
    while (true) {
      count += 1;
      if (count > 20) return;
      if (nl == -1) {
        this.current += chunk;
        break;
      } else {
        this.current += chunk.substring(0, nl);
        this.on_line(this.opts.json ? JSON.parse(this.current) : this.current);
        this.current = '';
        chunk = chunk.substring(nl+1);
        nl = chunk.indexOf("\n");
      }
    }
    if (is_done && this.current) {
      this.on_line(this.opts.json ? JSON.parse(this.current) : this.current);
      this.current = '';
    }
  }
  run(on_line, on_done) {
    this.on_line = on_line;
    this.on_done = on_done;
    let req = fetch(this.path, this.req);
    req.then((r) => {
      let reader = r.body.pipeThrough(new TextDecoderStream()).getReader();
      let done, value, count = 0;
      let fn = () => {
        reader.read().then((v) => {
          //console.log("New", v);
          if (v.done) {
            this.parse_lines(v.value || '', true);
            if (this.on_done) this.on_done();
            return;
          }
          this.parse_lines(v.value);
          fn();
        });
      };
      fn();
    });
    return req;
  }
}

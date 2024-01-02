export function FindListItems(text) {
  let res = [];
  text.split("\n").forEach((line) => {
    let m;
    if (m = /^((\d+\.?)|(-)|(\*)) ?(.*)/.exec(line)) {
      res.push(m[5]);
    }
  });
  return res;
};
export class AIChatJob {
  static QUEUED = 0;
  static RUNNING = 1;
  static COMPLETED = 2;
  static ERROR = 3;
  constructor(app, opts) {
    if (!opts) opts = {};
    this.ai_chat_job = true;
    this.api_base = opts.api_base || app.api_base || '';
    this.api_key = opts.api_key || app.api_key;
    this.api_model = opts.api_model || app.api_model || 'gpt-3.5-turbo';
    this.opts = opts;
    this.stream = '';
    this.response = '';
    this.running = false;
    this.messages = [];
    this.state = 0;
    this.app = app;
    this.response = '';
    this.promise = new Promise((resolve, reject) => { this.promise_res = resolve; this.promise_rej = reject });
  }

  add_message(prompt, role) {
    this.messages.push({
      role: role || 'user',
      content: prompt,
    });
  }
  run() {
    let p = this.promise;
    this.state = 1;
    let headers = {'content-type': 'application/json'};
    if (this.api_key) headers.authorization = 'Bearer ' + this.api_key;
    let stream = new this.app.stream.LineStream(this.api_base + '/v1/chat/completions', {
      method: 'POST',
      body: JSON.stringify({
        model: this.api_model,
        stream: true,
        messages: this.messages,
      }),
      headers: new Headers(headers),
    });
    stream.run(
      (line) => {
        //console.log("Line:", line);
        let data;
        try {
          let m = /^data: (.*)$/.exec(line);
          if (m) {
            if (m[1] == '[DONE]') {
              data = {choices: [{delta: {content: ''}}]};
            } else {
              data = JSON.parse(m[1]);
            }
          } else if (line == '') {
            data = {choices: [{delta: {content: ''}}]};
          } else {
            data = {choices: [{delta: {content: "\n?? " + line + "\n"}}]};
          }
        } catch {
          data = {choices: [{delta: {content: "\nError on: " + line + "\n"}}]};
        }
        this.response += data.choices[0].delta.content || '';
      },
      () => {
        this.running = false;
        this.state = 2;
        this.promise_res(true);
      }
    ).catch((err) => {
      this.running = false;
      this.state = 3;
      this.error = err;
      this.promise_rej(err);
    });
    return p;
  }

}

import * as Prompt from './prompt-entry.js'

export class PromptChain {
  constructor(app, opts) {
    if (!opts) opts = {};
    this.title = opts.title;
    this.opts = opts;
    this.app = app;
    this.prompts = {};
    this.last_id = 0;

    this.entry_points = [];
  }

  import_entries(entry_parent, entrypoints) {
    for (let entry of entrypoints) {
      let child = entry_parent.entrypoint(entry.id, entry.opts);
      this.import_entries(child, entry.entry_points);
    }
  }
  static import_chain(app, data) {
    let chain = new PromptChain(app, {
      title: data.title,
    });

    for (let prompt of data.prompts) {
      chain.register({
        id: prompt.id,
        log: prompt.log,
        inputs: prompt.inputs,
        outputs: prompt.outputs,
        prompt: prompt.prompt,
      });
    }
    for (let entry of data.entry_points) {
      let ep = chain.entrypoint(entry.id, entry.opts);
      chain.import_entries(ep, entry.entry_points);
    }
    return chain;
  }
  entry_export(entry) {
    let ent = {
      id: entry.prompt_id,
      opts: {conditions: entry.conditions, map: entry.fields},
      entry_points: [],
    };
    for (let child of entry.entry_points) {
      ent.entry_points.push(this.entry_export(child));
    }
    return ent;
  }
  export_chain() {
    let chain = {
      title: this.title,
      prompts: [],
      entry_points: [],
    };

    for (let key in this.prompts) {
      let p = this.prompts[key];
      let entry = p.prompt_entry;
      let prompt = {
        id: p.id,
        log: p.log,
        name: p.name,
        inputs: entry.inputs,
        outputs: entry.outputs,
        prompt: entry.prompt,
      }
      chain.prompts.push(prompt);
    }

    for (let entry of this.entry_points) {
      chain.entry_points.push(this.entry_export(entry));
    }

    return chain;
  }
  get_response_value(response, output) {
    if (output.parser == 'full_response') {
      return response;
    } else if (output.parser == 'from_line') {
      for (let line of response.split("\n")) {
        line = line.toLowerCase();
        if (line.toLowerCase().startsWith(output.parser_ex)) {
          return line.slice(output.parser_ex.length).trim();
        }
      }
    }
    return '';
  }
  run_entry(ep, state) {
    //console.log("Starting entry", ep.prompt.name, state, ep);
    let ep_state = {ai_tone: state.ai_tone};
    for (let key in ep.fields) {
      ep_state[key] = state[ep.fields[key]];
    }
    return new Promise((res,rej) => {
      //console.log("Run entry", ep.prompt.name, ep_state, ep);
      let job = ep.prompt.prompt_entry.create_job(ep_state, {
        summary: (this.title) + ": " + (ep.prompt.log || ep.prompt.name),
      });
      let fj = this.app.ai_queue.add_job(job.run.bind(job), {priority: 5})
      this.app.ai_log.push({job: fj, request: job})
      console.log("Starting entry job", ep.prompt.name, job.messages.map((m) => m.content));

      job.promise.then((result) => {
        let response = job.response;
        let events = [];
        let i = 0;
        for (let output of ep.prompt.prompt_entry.outputs) {
          let out_name = output.target || output.name;
          let res = this.get_response_value(response, output);
          if (output.event) {
            events.push({event: output.event, value: res, source: output});
          }
          state[out_name] = res;
          //console.log("Set output", output, out_name, res, "State:", state);
        }
        //console.log("Job finished", ep.prompt.name, state, job, ep_state);
        res({children: ep.entry_points, events: events});
      }).catch((err) => {
        console.log("Job failed!", err)
        rej({error: err});
      });
    });
  }

  check_condition(state, condition) {
    if (condition.op == '==') {
      return state[condition.name] == condition.value;
    } else if (condition.op == '!=') {
      return state[condition.name] != condition.value;
    } else if (condition.op == 'include') {
      return state[condition.name].indexOf(condition.value) != -1;
    } else if (condition.op == 'exclude') {
      return state[condition.name].indexOf(condition.value) == -1;
    }
  }
  start(fields, opts) {
    let state = {};
    let p, res, rej;
    if (!opts) opts = {};
    p = new Promise((resolve, reject) => { res = resolve; rej = reject; });
    for (let key in fields) {
      state[key] = fields[key];
    }
    let eps = [...this.entry_points];

    console.log("Start chain", this.title, state);
    let run_next = (eps) => {
      let ep = eps.splice(0, 1)[0];
      //console.log("Running next", eps.length, ep);
      if (!ep) {
        //console.log("Chain complete", this.title, state);
        if (opts.update) opts.update(state);
        res(state);
        return;
      }
      let should_run = true;

      if (ep.conditions) {
        for (let cond of ep.conditions) {
          let check = this.check_condition(state, cond);
          console.log("Check condition", cond, "=", check, state);
          if (!check) {
            should_run = false;
            break;
          }
        }
      }
      if (should_run) {
        this.run_entry(ep, state, opts).then((r) => {
          for (let c of r.children) { eps.push(c) }
          for (let evt of r.events) {
            if (opts.onEvent) opts.onEvent(evt);
          }
          if (opts.update) opts.update(state);
          run_next(eps);
        });
      } else {
        run_next(eps);
      }
    };

    run_next(eps);
    return p;
  }
  get_next_id() {
    this.last_id += 1;
    return this.last_id;
  }

  register(opts) {
    let prompt = new Prompt.PromptEntry(this.app, {
      prompt: opts.prompt,
      inputs: opts.inputs,
      outputs: opts.outputs,
    });
    let id;
    if (opts.id) {
      id = opts.id;
      this.last_id = opts.id;
    } else {
      id = this.get_next_id();
    }
    this.prompts[id] = {
      id: id,
      log: opts.log,
      name: opts.name || `prompt${id}`,
      prompt_entry: prompt,
      children: [],
    };
    return this.prompts[id];
  }

  add_child(ep, id, opts) {
    let p = this.prompts[id];
    let ent = {
      prompt_id: id,
      prompt: p,
      conditions: opts.conditions || [],
      fields: opts.map,
      entry_points: [],
    };
    ep.entry_points.push(ent);
    ent.entrypoint = this.add_child.bind(this, ent);
  }
  entrypoint(id, opts) {
    let p = this.prompts[id];
    let ent = {
      prompt_id: id,
      prompt: p,
      conditions: opts.conditions || [],
      fields: opts.map,
      entry_points: [],
    };
    ent.entrypoint = this.add_child.bind(this, ent);
    this.entry_points.push(ent);
    return ent;
  }

}

import * as ai_job from './ai-job.js'

export class PromptInstance {
  constructor(entry, opts) {
    this.entry = entry;
    this.inputs = {ai_tone: opts.inputs.ai_tone};

    for (let input of entry.inputs) {
      this.inputs[input] = opts.inputs[input];
    }

    this.outputs = {full_message: ''};
    for (let output of entry.outputs) {
      this.outputs[output.name] = '';
    }
  }

  generate_prompt() {
    let prompt_str = this.entry.prompt;
    for (let key in this.inputs) {
      prompt_str = prompt_str.replaceAll('{{' + key + '}}', this.inputs[key]);
    }
    return prompt_str;
  }
}

export class PromptEntry {
  constructor(app, opts) {
    if (!opts) opts = {};
    this.opts = opts;
    this.app = app;
    this.prompt = opts.prompt;
    this.inputs = opts.inputs;
    this.outputs = opts.outputs;
    this.parser = opts.parser || this.line_parser;
  }

  create_job(inputs, opts) {
    if (!opts) opts = {};
    let inst = new PromptInstance(this, {inputs: inputs});
    let job = new ai_job.AIChatJob(this.app, {instance: inst, summary: opts.summary});
    job.add_message(inst.generate_prompt(), this.opts.role || 'system');
    return job;
  }
}

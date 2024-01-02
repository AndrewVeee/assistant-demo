/*
Entry point of app, so you can:

- Initialize API
- Initialize routes
- Customize "app" to your needs

After this, the Main.vue component will load.
*/

//import MyCmp from './cmp/my-cmp.vue'
import Home from './cmp/home.vue'
import * as LineStream from './lib/streamer.js'
import * as Jobs from './lib/job-queue.js'
import * as DB from './lib/db.js'
import * as Prompt from './lib/prompt-entry.js'
import {PromptChain} from './lib/prompt-chain.js'
import {TreeStore} from './lib/tree-store.js'

export function init(app, vue) {
  console.log("Initializing App!");
  app.debug = false;
  app.store_prefix = 'bai_';
  app.no_login = true;
  app.api_base = app.load_local('api_base', 'http://127.0.0.1:8080');
  app.api_key = app.load_local('api_key', 'no_key');
  app.api_model = app.load_local('api_model', 'gpt-3.5-turbo');
  app.ai_tone = app.load_local('ai_tone', 'Reply as a friendly, intelligent, concise assistant.');
  app.api = {};
  app.chain_map = {};
  app.chains = [];
  app.add_chain = (name,data) => {
    let chain = app.chainer.import_chain(app, data);
    chain.name = name;
    app.chain_map[name] = chain;
    app.chains.unshift(chain);
  };
  app.stream = LineStream;
  app.jobs = Jobs;
  app.ai_log = [];
  app.prompter = Prompt;
  app.feed = [];
  app.chainer = PromptChain;
  app.modals = [];
  app.modal_id = 0;
  app.open_modal = (opts, evts) => {
    app.modal_id += 1;
    app.modals.unshift({modal_id: 1, opts: opts, evts: evts});
  };
  app.close_modal = () => { app.modals.splice(0, 1); };
  app.ai_queue = new Jobs.JobQueue({debug: true});
  app.ai_queue.run();
  app.db = new DB.DB('busyai', 1, [
    {name: 'store', attrs: ['id', 'type', 'pid', 'name', 'text', 'meta']},
    {name: 'prompt', attrs: ['id', 'pid', 'name', 'prompt', 'meta']},
    {name: 'content_ex', attrs: ['id', 'pid', 'type', 'name', 'content', 'meta']},
  ]);
  app.todo_list = new TreeStore({pid: 'pid', id: 'id'});
  app.user = {logged_in: true, alias: 'Admin'};

  init.vue.component('Home', Home);

};

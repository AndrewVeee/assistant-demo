<script>

import {AIChatJob, FindListItems} from '../lib/ai-job.js';
import TodoList from './todo-list.vue';
import PromptList from './prompt-list.vue';
import Feed from './feed.vue';
import Modal from './modal.vue';
import ModalTextInput from './modal-text-input.vue';
//import DefaultChains from '../data/chains.js';
import MessageHandler from '../data/message-handler.json';
import UserRequestHandler from '../data/user-request.json';

export default {
  props: ['app'],
  components: {TodoList, PromptList, Feed, Modal},
  data() {
    return {
      todo_list: this.app.todo_list,
      new_todo: '',
      chat_msg: '',
      chat_handler: 'User Request',
      logs: this.app.ai_log,
      views: {todo: TodoList, prompts: PromptList},
      view: 'stream',
      AIChatJob: AIChatJob,
    };
  },
  methods: {
    addToDo: function(todo, parent) {
      let from_main = false;
      if (!todo) { from_main = true; todo = this.new_todo; }
      let new_ent = {type: 'todo', text: todo, pid: 0};
      this.app.db.store.create(new_ent).then((r) => { this.todo_list.add_root(r) });
      if (from_main) this.new_todo = '';
    },
    onFillTodo: function(todo) {
      let job = new AIChatJob(this.app);
      job.add_message(
          "Let's help the user break down this to do task." +
          "Make a bullet list of up to 5 tasks to complete the item below.\n\n" +
          "Keep each entry short. One sentence at most, and short, like: 'Go to grocery store.' or 'Write a short document.'",
          'system'
      )
      job.add_message("My to do task:\n" + todo.text);
      let full_job = this.app.ai_queue.add_job(job.run.bind(job), {priority: 5});
      this.logs.push({job: full_job, request: job});
      full_job.promise.then((r) => {
        r = job.response;
        console.log("Finished todo", r);
        let items = FindListItems(r);
        items.forEach((c) => { todo.children.push({text: c}) });
      });
    },
    onSendChat: function(message) {
      let msg = message;
      if (!msg) {
        msg = this.chat_msg;
      }
      let chain = null;
      if (this.chat_handler) {
        console.log("Handler", this.chat_handler);
        for (let c of this.app.chains) {
          if (c.title == this.chat_handler) { chain = c; break; }
        }
      }
      if (chain) {
        console.log("Start chain", chain);
        this.app.ai_log.push({user_message: true, content: msg});
        chain.start({message: msg, ai_tone: this.app.ai_tone}, {
          onEvent: (evt) => { console.log("Event", evt) },
        });
        if (!message) this.chat_msg = '';
        return;
      }
      //this.app.ai_log.push({user_message: true, content: msg});
      let job = new AIChatJob(this.app);
      job.add_message(this.app.ai_tone, 'system')
      job.add_message(msg);
      let full_job = this.app.ai_queue.add_job(job.run.bind(job), {priority: 10});
      this.logs.push({job: full_job, request: job});
      if (!message) this.chat_msg = '';
    },
    setAITone: function() {
      this.app.open_modal({title: 'AI Tone',
        cmp: ModalTextInput,
        multiline: false,
        content: this.app.ai_tone,
        info: 'Give your assistant some personality. Write a short sentence to describe how they should reply (even add a name).',
        onSave: (value) => {
          this.app.save_local('ai_tone', value);
          this.app.ai_tone = value;
        },
      });
    },
    setAPIKey: function() {
      this.app.open_modal({title: 'API Key',
        cmp: ModalTextInput,
        multiline: false,
        content: '',
        info: 'Enter the API key.',
        onSave: (value) => {
          this.app.save_local('api_key', value);
          this.app.api_key = value;
        },
      });
    },
    setAPIBase: function() {
      this.app.open_modal({title: 'API Base URL',
        cmp: ModalTextInput,
        multiline: false,
        content: this.app.api_base,
        info: 'Enter the base URL for the API. We\'ll automatically append /v1/chat/completions.',
        onSave: (value) => {
          this.app.save_local('api_base', value);
          this.app.api_base = value;
        },
      });
    },
    onShowLog: function(log) {
      window.log = log;
      this.app.open_modal({title: 'Full Message',
        cmp: ModalTextInput,
        multiline: true,
        hide_save: true,
        rows: 20,
        content: log.request.messages.map((m) => m.role + ": " + m.content).join("---\n") +
          "\n\n*** Response:\n" + log.request.response
      });
    }
  },
  created: function() {
    this.app.db.store.all({filter: (ent) => {return ent.type == 'todo'} }).then((r) => {
      this.app.todo_list.init(r);
      this.todos = this.app.todo_list.roots;
    });
    if (this.app.chains.length == 0) {
      this.app.add_chain('message', MessageHandler);
      this.app.add_chain('user_req', UserRequestHandler);
    }
  },
}
</script>

<template>
<div class="flex-grow flex-y bg-sec">
  <div class="flex-x m-1 mx-2 xcard round-sm">
    <div class="ml-0 card flex-x flex-ctr">
      <h3 class="my-0 mr-3">AI Assistant</h3>
      <button @click="view = 'stream'" class="btn btn btn-tab mr-2"
          :class="view == 'stream' ? 'btn-tab-sel' : ''">Stream</button>
      <button @click="view = 'todo'" class="btn btn btn-tab mr-2"
          :class="view == 'todo' ? 'btn-tab-sel' : ''">To Do List</button>
      <button @click="view = 'prompts'" class="btn btn btn-tab mr-2"
          :class="view == 'prompts' ? 'btn-tab-sel' : ''">Prompts</button>
      <div class="flex-grow"></div>
    </div>
    <div class="flex-grow"></div>
    <div class="ml-2">
      <span class="clickable highlight px-2 py-1 round"
          @click="setAPIBase">
        <strong class="mr-2">API</strong> {{app.api_base}}
      </span>
    </div>
    <div class="ml-2">
      <span class="clickable highlight px-2 py-1 round"
          @click="setAPIKey">
        Set Key
      </span>
    </div>
    <div class="ml-2">
      <span class="clickable highlight px-2 py-1 round"
          @click="setAITone">
        Personality
      </span>
    </div>
    <div class="ml-2" v-if="false">
      Status:
      <span>{{app.ai_queue.run_count > 0 ? 'On' : 'Off'}}</span>
    </div>
  </div>
  <div class="flex-x flex-grow flex-stretch bg-sec pt-2">
    <!-- Main Section -->
    <Feed :app="app" v-show="view == 'stream'"></Feed>
    <TodoList :app="app" v-show="view == 'todo'"></TodoList>
    <PromptList :app="app" v-show="view == 'prompts'"></PromptList>

    <!-- Sidebar -->
    <div class="flex-y card mb-2 mr-1" style="max-width: 25%; width: 500px;">
      <h3 class="mt-0 mb-2">Log</h3>
      <div class="flex-grow" style="overflow-y: scroll; height: 0;">
        <div v-for="log in logs" class="p-1 px-2 mb-2 round-xl" style="white-space: pre-wrap; background-color: #f0f0ff;">
          <div v-if="log.user_message">
            <strong>{{ log.content }}</strong>
          </div>
          <div v-else-if="log.request.ai_chat_job">
            <div class="mb-1 text-sm" style="font-weight: bold; white-space: normal;"
                v-if="log.request.opts.summary">
              {{log.request.opts.summary}}
              <button @click="onShowLog(log)" class="btn btn-sm">⛶</button>
            </div>
            <div class="mb-1 text-sm" style="font-weight: bold"
                v-else>
              {{log.request.messages.map((m) => m.content).join("\n") }}
            </div>
            <div>{{log.request.response}}</div>
            <div class="mt-2" v-if="log.request.state == AIChatJob.ERROR">
              Error: {{log.request.error}}
            </div>
            <div class="mt-1" v-else>
              {{log.request.state == AIChatJob.COMPLETED ? '' : (log.request.state == AIChatJob.RUNNING ? 'Running' : 'Queued')}}
            </div>
          </div>
          <div v-else>
            {{log.job}}
          </div>
        </div>
      </div>
      <div class="flex-x p-1 pb-0">
        <div class="mr-2">Handler:</div>
        <div class="flex-grow flex-x">
          <select v-model="chat_handler" class="form-control flex-grow">
            <option :value="null">None</option>
            <option :value="chain.title" v-for="chain in app.chains">{{chain.title}}</option>
          </select>
        </div>
      </div>
      <div class="flex-x p-1">
        <input @keypress.enter="onSendChat()" class="form-control p-1 flex-grow" v-model="chat_msg" />
        <div class="ml-1">
          <button @click="onSendChat()" class="btn">Chat</button>
        </div>
      </div>
    </div>
  </div>

  <Modal :key="modal.id" :app="app" :cfg="modal" v-for="modal,idx in app.modals"
      v-show="idx==0">
  </Modal>
</div>
</template>

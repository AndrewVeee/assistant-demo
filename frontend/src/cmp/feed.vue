<script>
import {AIChatJob, FindListItems} from '../lib/ai-job.js';
import PromptEntry from './prompt-entry.vue';
import ModalTestAdd from './modal-test-add.vue';

export default {
  props: ['app', 'item', 'level'],
  components: {PromptEntry},
  data() {
    return {
      feed: this.app.feed,
      prompt_test: '',
      new_todo: '',
    } 
  },  
  methods: {
    addContent: function(data) {
      let entry = {
        type: data.type,
        content: data.content,
        category: '',
        summary: '',
        log: [],
        suggestions: [],
        archived: false,
        notes: '',
        pinned: false,
        processed: false,
        processing: false,
      };
      this.feed.unshift(entry);
    },
    onAddCont: function() {
      this.app.open_modal({
        title: 'Add Content to Stream',
        cmp: ModalTestAdd,
        onAdd: (res) => {
          this.addContent({type: res.type, content: res.content});
        },
      });
    },
    startFeedChain: function(entry, chain) {
      entry.processing = true;
      entry.summary = '';
      chain.start({message: entry.content, ai_tone: this.app.ai_tone}, {
        onEvent: (evt) => {
          console.log("Chain evt", evt);
          if (evt.event.startsWith('summary')) entry.summary += evt.value + "\n\n";
          if (evt.event.startsWith('categorize')) entry.category = evt.value;
          if (evt.event.startsWith('suggest')) {
            entry.suggestions = evt.value.split("\n");
          }
        },
      }).then((state) => {
        console.log("Chain complete", state);
        entry.processed = true;
        entry.processing = false;
      });
    },
  },
  beforeUnmount: function() {
  },
  created: function() {
  },
}
</script>

<template>
<div class="xcard mx-2 mb-1 flex-x flex-grow flex-stretch bg-sec pt-0">
  <div class="flex-grow flex-y" style="overflow-y: auto;">
    <div class="mb-1 flex-x">
      <div style="overflow-x: auto;" v-if="false">
        <div class="card p-1 round-sm text-sm mr-2" style="display: inline-block; max-width: 200px;">
          Important Bill
        </div>
        <div class="card p-1 round-sm text-sm mr-2" style="display: inline-block; max-width: 200px;">
          To Do: Blah
        </div>
      </div>
      <div class="flex-grow"></div>
      <div>
        <button @click="onAddCont" class="btn bg-light">Add Entry</button>
      </div>
    </div>
    <div class="flex-scroll-y pr-1">
      <div class="xmx-3 p-3">
        <div class="card p-1 mb-2" v-for="entry in feed">
          <div v-if="false" class="flex-x bg-sec p-1 mb-1 text-xs" style="border-radius: 10px; border-width: 1px;">
            <div class="mr-2" v-if="entry.from">From: {{entry.from}}</div>
            <div class="flex-grow mr-2">{{entry.subject}}</div>
          </div>
          <div class="text" style="white-space: pre-wrap;">{{entry.summary}}</div>
          <div v-if="entry.suggestions.length > 0" class="mb-1">
            <strong>Suggesed Responses:</strong>
            <div v-for="sug in entry.suggestions" class="text-sm ml-1 mt-1">
              {{ sug }}
            </div>
          </div>
          <div class="bg-sec text-xs p-1" style="white-space: pre-wrap; max-height: 10em; overflow: hidden;">{{entry.content}}</div>
          <div v-if="false">{{entry}}</div>
          <div class="flex-x text-sm mt-1">
            <div class="mr-2" v-if="entry.processing">Processing...</div>
            <div class="mr-2">{{entry.type}}</div>
            <div class="flex-grow"></div>
            <div v-for="chain in app.chains">
              <button @click="startFeedChain(entry, chain)" class="btn btn-sm">Run {{chain.title}}</button>
            </div>
            <div class="ml-2 text-xs highlight p-1 round" v-if="entry.category">{{entry.category}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex-x p-1" v-if="false">
      <div class="flex-grow p-rel flex-x">
        <input class="form-control flex-grow" v-model="new_todo"
            @keypress.enter=""/>
      </div>
      <div class="ml-1">
        <button @click="onAddCont" class="btn">Add</button>
      </div>
    </div>
  </div>
</div>
</template>

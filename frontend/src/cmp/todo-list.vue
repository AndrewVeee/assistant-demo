<script>
import {AIChatJob, FindListItems} from '../lib/ai-job.js';
import TodoEntry from './todo-entry.vue';

export default {
  props: ['app', 'item', 'level'],
  components: {TodoEntry},
  data() {
    return {
      todo_list: this.app.todo_list,
      new_todo: '',
    } 
  },  
  methods: {
    addToDo: function(todo, parent) {
      let from_main = false;
      if (!todo) { from_main = true; todo = this.new_todo; }
      let new_ent = {type: 'todo', text: todo, pid: 0};
      this.app.db.store.create(new_ent).then((r) => { this.todo_list.add_root(r) });
      if (from_main) this.new_todo = '';
    },
    delete_entries: function(entries) {
      for (let ent of entries) {
        console.log("Delete", ent.entry.text);
        this.delete_entries(ent.children);
        ent.entry.destroy();
      }
    },
    onDelete: function(child,idx) {
      this.todo_list.roots.splice(idx, 1);
      this.delete_entries(child.children);
      child.entry.destroy();
    },
  },
  beforeUnmount: function() {
  },
  created: function() {
  },
}
</script>

<template>
<div class="card mx-2 mb-2 flex-x flex-grow flex-stretch bg-sec pt-2">
  <div class="flex-grow flex-y mr-2" style="overflow-y: auto;">
    <div class="flex-scroll-y pr-1" v-if="todo_list">
      <div class="mx-2 p-3 round-sm">
        <TodoEntry :key="todo.id" v-for="todo,idx in todo_list.roots"
            @delete="onDelete(todo,idx)"
            :app="app" :item="todo">
        </TodoEntry>
      </div>
    </div>
    <div class="flex-x p-1">
      <div class="flex-grow p-rel flex-x">
        <input class="form-control flex-grow" v-model="new_todo"
            @keypress.enter="addToDo()"/>
      </div>
      <div class="ml-1">
        <button @click="addToDo()" class="btn">Add</button>
      </div>
    </div>
  </div>
</div>
</template>

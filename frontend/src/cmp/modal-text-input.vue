<script>

export default {
  props: ['app', 'opts'],
  components: {},
  data() {
    return {
      content: this.opts.content,
      multiline: this.opts.multiline,
    };
  },  
  methods: {
    onSave: function() {
      this.opts.onSave(this.content);
      this.$emit('close');
    },
  },
  beforeUnmount: function() {
  },
  mounted: function() {
    this.$nextTick(() => {
      this.$refs.content.focus();
    });
  },
  created: function() {
  },
}
</script>

<template>
<div class="p-2 pt-0" style="">
  <p v-if="opts.info">{{opts.info}}</p>
  <div class="flex-x">
    <input @keypress.enter="onSave" type="text" ref="content" v-model="content" class="form-control flex-grow" v-if="!multiline" />
    <textarea v-model="content" ref="content" class="form-control flex-grow" :rows="opts.rows || 10" v-else></textarea>
  </div>

  <button @click="onSave" class="btn btn-pri mt-2" v-if="!opts.hide_save">Save</button>
</div>
</template>

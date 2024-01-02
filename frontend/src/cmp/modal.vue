<script>

export default {
  props: ['app', 'cfg'],
  components: {},
  data() {
    return {
      header: true,
    } 
  },  
  methods: {
  },
  beforeUnmount: function() {
  },
  created: function() {
  },
}
</script>

<template>
<div @click="app.modals.splice(0,1)" style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; background-color: #0002;">
  <div @click.stop class="card" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); min-width: 600px;
      max-width: 90%;">
    <h3 class="mt-1 mb-2" v-if="cfg.opts.title">{{cfg.opts.title}}</h3>
    <component :is="cfg.opts.cmp" :app="app" :opts="cfg.opts" v-bind="cfg.opts.bind" v-if="cfg.opts.cmp"
        @hide-header="header = false"
        @close="app.close_modal()"
      >
    </component>
  </div>
</div>
</template>

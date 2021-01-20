<template>
  <div class="hello">
    <el-tree default-expand-all :data="astTree" @node-click="handleNodeClick" :props="defaultProps">
      <span class="custom-tree-node" slot-scope="{ node, data }">
        <span>{{ data.type =='Tag' ? data.tagOpen : data.value}}</span>
        <span>{{ data.type =='Tag' ? data.tagClose : ''}}</span>
      </span>
    </el-tree>
    <!-- <span v-html="htmlstr"></span> -->
  </div>
</template>

<script lang="ts">
import { Component, Provide, Vue } from "vue-property-decorator";

import { Tree } from 'element-ui';
// import { parse } from "html5parser";
import { parse } from '@/util/htmlParse/parse'
// import htmlstr from "./htmldata";
import htmlstr from "./smdata";

@Component({
  components:{
    Tree
  }
})
export default class HelloWorld extends Vue {
  @Provide() htmlstr = htmlstr;
  @Provide() astTree: any = [];
  @Provide() astString = "11";
  @Provide() defaultProps:Record<string, any> = {
    children:'children',
    label:'name'
  }
  mounted() {
    this.astTree = parse(htmlstr);
    console.log(this.astTree);
  }
  handleNodeClick(data:any):void{
    console.log(data)
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
</style>

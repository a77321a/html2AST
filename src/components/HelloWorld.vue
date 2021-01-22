<template>
  <div class="hello">
    <el-input placeholder="请输入内容" v-model="curl">
      <template slot="prepend">Http://</template>
    </el-input>
    <el-button @click="handleGetHtml" type="primary">获取</el-button>

    <div class="img-wrap">
      <img class="img-view" :src="pngFile" alt="">
    </div>

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
import htmlstr from "./htmldata";
// import htmlstr from "./smdata";
import axios from 'axios'
@Component({
  components:{
    Tree
  }
})
export default class HelloWorld extends Vue {
  @Provide() curl = ''
  @Provide() htmlstr = htmlstr;
  @Provide() astTree: any = [];
  @Provide() astString = "11";
  @Provide() pngFile = ''
  @Provide() defaultProps:Record<string, any> = {
    children:'children',
    label:'name'
  }
  mounted() {
    // this.astTree = parse(htmlstr);
    // axios.get('http://localhost:7001/home',{
    //   params:{
    //     url:'https://cattest.migu.cn:8083/#/'
    //   }
    // }).then((res)=>{
    //   console.log(res);
    //   this.astTree = parse(res.data.data.html)
    //   this.pngFile = 'data:image/png;base64,'+res.data.data.pngfile
    // })
  }
  handleNodeClick(data:any):void{
    console.log(data)
  }
  handleGetHtml(){
    axios.get('http://localhost:7001/home',{
      params:{
        url:this.curl
      }
    }).then((res)=>{
      console.log(res);
      this.astTree = parse(res.data.data.html)
      this.pngFile = 'data:image/png;base64,'+res.data.data.pngfile
    })
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
.img-wrap{
  width: 100%;
}
.img-wrap .img-view{
  display: block;
  width: 100%;
}
</style>

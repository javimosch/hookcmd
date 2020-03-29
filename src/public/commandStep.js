Vue.component('command-step',{
    name:"CommandStep",
    template:`
        <div class="commandStep">
            <i class="fas fa-ellipsis-v drag"></i>
            <textarea class="cmd" @change="change" v-model="cmd">
            </textarea>
            <input type="checkbox" v-model="required" @change="change"/>
            <label> Required </label>
        </div>
    `,
    data(){
        return {
            _id: this.value._id ||'_' + Math.random().toString(36).substr(2, 9),
            cmd:this.value.cmd||"",
            required:this.value.required!==undefined?this.value.required:true
        }
    },
    props:["value"],
    methods:{
        change(){
            this.$emit('input',Object.assign({},this.$data))
        }
    }
})
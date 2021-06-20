<template>
  <h1>Scanner example</h1>
  <Scanner/>
</template>

<script>
import Scanner from './components/Scanner'

export default {
  name: 'App',
  components: {
    Scanner,
  },
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

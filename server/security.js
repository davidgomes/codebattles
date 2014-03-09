Meteor.methods({
  checkCode: function(code,language) {
    var execute = false;
    if (language.indexOf("python") !== -1){
      Meteor.call("checkPythonCode", code, function(error, response){ 
        execute = response;
      });
    }
    return execute;
  },
  checkPythonCode: function(code){
    //check imports
    var index;
    var token = "import";
    var lib;
    var allowedImports = ["math"];
    while(1){
      index = code.indexOf("import",index);
      if (index === -1) break;
      lib = code.substring(index+token.length+1,code.indexOf("\n",index+token.length+1));
      if (allowedImports.indexOf(lib) === -1) return false;
      index += token.length;
    }
    return true;
  }
});
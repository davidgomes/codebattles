problems = JSON.parse(Assets.getText("problemset1.json"));
problems = problems.concat(JSON.parse(Assets.getText("davidproblems.json")));
nproblems = problems.length;

for (var i = 0; i < nproblems; i++) {
  problems[i].id = i + 1;
}

console.log(problems);

Meteor.methods({
  getProbInputById: function(id,n) {
    return problems[id - 1].io[n].input;
  },
  
  getProbOutputById: function(id,n) {
    return problems[id - 1].io[n].output;
  },
  
  getNTestCases: function(id) {
    return problems[id - 1].io.length;
  }
});

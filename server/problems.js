problems = JSON.parse(Assets.getText("problemset1.json"));
nproblems = problems.length;

Meteor.methods({
  getProbInputById: function(id,n) {
    return problems[id-1].io[n].input;
  },
  getProbOutputById: function(id,n) {
    return problems[id-1].io[n].output;
  },
  getNTestCases: function(id) {
    return problems[id-1].io.length;
  }
});

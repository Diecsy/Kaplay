const Character = {};
Character.Skills = {
  UpUp: {
    Name: "Repent",
    Description: "Up air",
    Function: function () {
      console.log("Working");
    },
  },

  BasicAttack: {
    Name: "Basic Punch",
    Description: "Basic Punch",
    Function: function () {
      console.log("Basic Punch");
    },
  },

  HeavyAttack: {
    Name: "Heavy Punch",
    Description: "Heavy Punch",
    Function: function () {
      console.log("Heavy Punch");
    },
  },

  RightDash: {
    Name: "Right Dash",
    Description: "Right Dash",
    Function: function () {
      console.log("Right dash");
    },
  },

  LeftDash: {
    Name: "Left Dash",
    Description: "Left Dash",
    Function: function () {
      console.log("Left dash");
    },
  },
};

export { Character };

const Skills = {
    "Bind": { // The recorded keybind's executive order
        "Name": "Skill Name", // This would be the skill's actual name
        "Desc": "Up air", // Character skill description
        "Func": function() { // Skill Function for actually executing it
            console.log("hi");
        }
    },

    "BasicAttack": { // A character's basic attack
        "Name": "Basic Punch", // Attack name, like kick or punch, etc
        "Description": "Basic Punch", // Description, etc
        "Function": function () { // Attack Function for execution
            console.log("Basic Punch");
        }
    },

    "HeavyAttack": { // A character's heavy attack
        "Name": "Heavy Punch", // Attack name, like heavy kick or heavy punch, etc
        "Description": "Heavy Punch", // Description, etc
        "Function": function () { // Attack Function for execution
            console.log("Heavy Punch");
        }
    },
};

// Z - Record / End
// X - Light Attack
// C - Heavy Attack

// W - Jump
// A - Left
// S - Crouch
// D - Right

// A + A - Left Dash
// D + D - Right Dash
// W + W - Up Dash
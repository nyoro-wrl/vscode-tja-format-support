import { LanguageResources } from "./index";

/**
 * English Resources
 */
export const en: LanguageResources = {
  commands: {
    zoom: "Chart Zoom",
    truncate: "Chart Truncate",
    constantScroll: "Fix Scroll Speed",
    transitionScroll: "Transition Scroll Speed",
    deleteCommands: "Batch Delete Commands",
    toBig: "Replace with Big Notes",
    toSmall: "Replace with Small Notes", 
    toRest: "Replace with Rests",
    reverse: "Reverse Don/Ka",
    random: "Randomize Don/Ka"
  },

  messages: {
    // Common messages
    noChartInSelection: "No chart found in selection",
    
    // Zoom related
    zoomPrompt: "Enter zoom multiplier",
    zoomValidationInteger: "Please enter an integer",
    zoomValidationMinTwo: "Please enter an integer of 2 or greater",
    
    // ConstantScroll related
    constantScrollPrompt: "Enter reference BPM for scroll speed",
    constantScrollValidationNumber: "Please enter a number",
    
    // TransitionScroll related
    transitionScrollStartTitle: "Scroll Speed Start Value",
    transitionScrollStartPrompt: "Enter scroll speed start value",
    transitionScrollEndTitle: "Scroll Speed End Value",
    transitionScrollEndPrompt: "Enter scroll speed end value",
    transitionScrollFrequencyTitle: "Scroll Speed Transition Frequency",
    transitionScrollFrequencyPlaceholder: "Select transition frequency",
    transitionScrollEasingTitle: "Scroll Speed Easing",
    transitionScrollEasingPlaceholder: "Select easing type",
    frequencyMeasure: "Measure",
    frequencyLine: "Line",
    frequencyNote: "Note",
    frequencyAlways: "Always",
    
    // DeleteCommands related
    deleteCommandsPlaceholder: "Select commands to delete",
    deleteCommandsAll: "All",
    noCommandsInSelection: "No commands found in selection",
    
    // JumpMeasure related
    jumpMeasurePrompt: "Enter measure number to jump to",
    jumpMeasurePlaceholder: "1 ~ {0}",
    jumpMeasureValidationInteger: "Please enter an integer",
    jumpMeasureValidationNotFound: "Measure not found",
    jumpMeasureBranchPlaceholder: "Select branch to jump to",
    branchNormal: "Normal",
    branchExpert: "Expert",
    branchMaster: "Master",
    
    // ChangeLiteMode related
    liteModeNormal: "Normal Mode",
    liteModeLite: "Lite Mode",
    
    // ChangeLanguage related
    changeLanguagePlaceholder: "表示言語を選択 / Select display language / 选择显示语言",
    changeLanguageCurrent: "$(check) Current",
    changeLanguageLater: "Later",
    restartMessage: "Language setting has been changed. Please restart VS Code to apply the changes fully.",
    restartButton: "Restart"
  },
  
  config: {
    gogotimeHighlight: "Add color highlight for GoGo Time.",
    branchHighlight: "Add color distinction for each section of chart branches.",
    liteMode: "Skip syntax analysis to improve processing speed. All features will be disabled.",
    completion: "Completion display setting for player-specific commands",
    measureCountHint: "Display measure numbers on measures after empty lines.",
    language: "Select display language."
  },
  
  views: {
    chartInfo: "Chart Information"
  },
  
  statusBar: {
    measure: "Measure",
    combo: "Combo",
    liteMode: "Lite Mode",
    normalMode: "Normal Mode"
  },
  
  semanticTokens: {
    roll: "Roll",
    rollBig: "Roll (Big)",
    balloon: "Balloon",
    balloonBig: "Balloon (Big)",
    fuze: "Time Bomb",
    gogo: "GoGo Time"
  },

  // TJA Command Details
  tjaCommands: {
    start: {
      detail: "Start",
      documentation: "Start chart data description.\nThe range enclosed by `#START` and `#END` is interpreted as chart data.\n\nBy specifying `P1` or `P2` in `<player>`, you can describe the chart by player.",
      playerDescription: "Player Side\n`P1` or `P2`"
    },
    end: {
      detail: "End",
      documentation: "End chart data description.\nThe range enclosed by `#START` and `#END` is interpreted as chart data."
    },
    bpmchange: {
      detail: "BPM Change",
      documentation: "Change BPM.",
      bpmDescription: "BPM value"
    },
    measure: {
      detail: "Measure Line",
      documentation: "Add measure line.",
      measureDescription: "Measure specification"
    },
    scroll: {
      detail: "Scroll Speed",
      documentation: "Change scroll speed.",
      rateDescription: "Scroll speed multiplier"
    },
    delay: {
      detail: "Delay",
      documentation: "Add time delay.",
      secondDescription: "Delay time in seconds"
    },
    gogostart: {
      detail: "Go-Go Start",
      documentation: "Start Go-Go time."
    },
    gogoend: {
      detail: "Go-Go End", 
      documentation: "End Go-Go time."
    },
    section: {
      detail: "Branch Reset",
      documentation: "Reset the roll count and accuracy used for branch judgment.\nPlace it at least one measure before the location where you want to branch."
    },
    branchstart: {
      detail: "Branch Start",
      documentation: "Start chart branching.\n\n`<type>`: Specify branch condition. `r` for roll count, `p` for accuracy (%), `s` for score.\n`<expert>`: Value required for expert chart branching.\n`<master>`: Value required for master chart branching.\n\nBranch judgment is performed one measure before.\nIf a roll starts one measure before, that roll is also counted.\n\nAfter branching, describe with normal chart `#N`, expert chart `#E`, master chart `#M`.",
      typeDescription: "Branch condition\n`r` for roll count, `p` for accuracy (%), `s` for score.",
      expertDescription: "Value required for expert chart branching\n### Branch Condition Types\n`r`: Roll count, `p`: Accuracy (%), `s`: Score",
      masterDescription: "Value required for master chart branching\n### Branch Condition Types\n`r`: Roll count, `p`: Accuracy (%), `s`: Score"
    },
    branchend: {
      detail: "Branch End",
      documentation: "End chart branching.\nAfter this, all branches will play the common chart."
    },
    n: {
      detail: "Normal Chart",
      documentation: "Describe normal difficulty chart."
    },
    e: {
      detail: "Expert Chart", 
      documentation: "Describe expert difficulty chart."
    },
    m: {
      detail: "Master Chart",
      documentation: "Describe master difficulty chart."
    },
    levelhold: {
      detail: "Level Hold",
      documentation: "Fix the current branch level."
    }
  },

  // TJA Header Information
  tjaHeaders: {
    title: {
      detail: "Title",
      documentation: "Song title.",
      paramDescription: "Song title text"
    },
    subtitle: {
      detail: "Subtitle", 
      documentation: "Song subtitle.",
      paramDescription: "Subtitle text"
    },
    bpm: {
      detail: "BPM",
      documentation: "Beats per minute.",
      paramDescription: "BPM value"
    },
    wave: {
      detail: "Audio File",
      documentation: "Audio file path.",
      paramDescription: "Path to audio file"
    },
    offset: {
      detail: "Offset",
      documentation: "Audio offset in seconds.",
      paramDescription: "Offset value in seconds"
    },
    course: {
      detail: "Course",
      documentation: "Difficulty course.",
      paramDescription: "Course level (Easy/Normal/Hard/Oni/Ura)"
    },
    level: {
      detail: "Level",
      documentation: "Difficulty level.",
      paramDescription: "Difficulty rating (1-10)"
    },
    balloon: {
      detail: "Balloon",
      documentation: "Balloon hit counts.",
      paramDescription: "Comma-separated hit counts"
    }
  }
};

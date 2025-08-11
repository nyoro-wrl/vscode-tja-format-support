import { LanguageResources } from "./index";

/**
 * 中文资源
 */
export const zh: LanguageResources = {
  commands: {
    zoom: "谱面缩放",
    truncate: "谱面裁剪",
    constantScroll: "滚动速度固定化",
    transitionScroll: "滚动速度变换",
    deleteCommands: "批量删除命令",
    toBig: "替换为大音符",
    toSmall: "替换为小音符", 
    toRest: "替换为休止符",
    reverse: "反转咚/咔",
    random: "随机咚/咔"
  },
  
  config: {
    gogotimeHighlight: "为 GoGo Time 添加颜色高亮。",
    branchHighlight: "为谱面分岐的每个区段添加颜色区分。",
    liteMode: "跳过语法分析以提高处理速度。所有功能将被禁用。",
    completion: "玩家专用命令的补全显示设置",
    measureCountHint: "在空行后的小节显示小节编号。",
    language: "选择显示语言。"
  },
  
  views: {
    chartInfo: "谱面信息"
  },
  
  statusBar: {
    measure: "小节",
    combo: "连击",
    liteMode: "轻量模式",
    normalMode: "普通模式"
  },
  
  semanticTokens: {
    roll: "连打",
    rollBig: "连打（大）",
    balloon: "气球",
    balloonBig: "气球（大）",
    fuze: "定时炸弹",
    gogo: "GoGo Time"
  },

  // TJA命令详细信息
  tjaCommands: {
    start: {
      detail: "开始",
      documentation: "开始谱面数据的描述。\n`#START`和`#END`之间的内容将被解释为谱面数据。\n\n通过在`<player>`中指定`P1`或`P2`，可以分别描述不同玩家的谱面。",
      playerDescription: "玩家方向\n`P1`或`P2`"
    },
    end: {
      detail: "结束", 
      documentation: "结束谱面数据的描述。\n`#START`和`#END`之间的内容将被解释为谱面数据。"
    },
    bpmchange: {
      detail: "BPM变更",
      documentation: "更改BPM（节拍速度）。",
      bpmDescription: "BPM数值"
    },
    measure: {
      detail: "拍号变更",
      documentation: "更改拍号。\n`4/4`表示4/4拍，`6/8`表示6/8拍。",
      measureDescription: "拍号\n`4/4`表示4/4拍，`6/8`表示6/8拍。"
    },
    scroll: {
      detail: "滚动速度变更", 
      documentation: "将谱面滚动速度更改为`<rate>`倍。\n默认值为`1`。",
      rateDescription: "滚动速度（基准值: 1）"
    },
    delay: {
      detail: "谱面延迟（停止）",
      documentation: "将谱面流动的时机延迟`<second>`秒。\n在`#BMSCROLL`、`#HBSCROLL`应用下会变成谱面停止处理。",
      secondDescription: "停止秒数"
    },
    gogostart: {
      detail: "GoGo Time开始",
      documentation: "开始GoGo Time。\nGoGo Time中音符会发光，得分会变为1.2倍。"
    },
    gogoend: {
      detail: "GoGo Time结束", 
      documentation: "结束GoGo Time。"
    },
    section: {
      detail: "分支判定重置",
      documentation: "重置谱面分支判定使用的连击数和精度。\n请放置在想要分支位置的一小节以上前面。"
    },
    branchstart: {
      detail: "分支开始", 
      documentation: "开始谱面分支。\n\n`<type>`: 指定分支条件。`r`为连击数，`p`为精度(%)，`s`为分数。\n`<expart>`: 玄人谱面分支所需的数值。\n`<master>`: 达人谱面分支所需的数值。\n\n分支判定在一小节前进行。\n如果从一小节前开始连击，该连击也会被计算。\n\n分支后用普通谱面`#N`、玄人谱面`#E`、达人谱面`#M`来记述。",
      typeDescription: "分支条件\n`r`为连击数，`p`为精度(%)，`s`为分数。",
      expertDescription: "玄人谱面分支所需的数值\n### 分支条件类型\n`r`: 连击数, `p`: 精度(%), `s`: 分数",
      masterDescription: "达人谱面分支所需的数值\n### 分支条件类型\n`r`: 连击数, `p`: 精度(%), `s`: 分数"
    },
    branchend: {
      detail: "分支结束",
      documentation: "结束谱面分支。\n之后所有分支都会流动共同的谱面。"
    },
    n: {
      detail: "普通谱面",
      documentation: "记述普通谱面。"
    },
    e: {
      detail: "玄人谱面",
      documentation: "记述玄人谱面。"
    },
    m: {
      detail: "达人谱面",
      documentation: "记述达人谱面。"
    },
    levelhold: {
      detail: "分支固定",
      documentation: "固定当前的分支级别。"
    }
  },

  // TJA头部信息
  tjaHeaders: {
    title: {
      detail: "标题",
      documentation: "曲目的标题。",
      paramDescription: "标题"
    },
    subtitle: {
      detail: "副标题",
      documentation: "曲目的副标题。",
      paramDescription: "副标题"
    },
    bpm: {
      detail: "BPM",
      documentation: "曲目的BPM（节拍速度）。",
      paramDescription: "BPM数值"
    },
    wave: {
      detail: "音频文件",
      documentation: "指定音频文件的路径。\n支持wav、ogg等格式。",
      paramDescription: "音频文件路径"
    },
    offset: {
      detail: "偏移量",
      documentation: "音频和谱面的时间偏移量（秒）。\n负值表示谱面提前，正值表示谱面延后。",
      paramDescription: "偏移秒数"
    },
    course: {
      detail: "难度",
      documentation: "谱面的难度。\n`<course>`: `Easy`、`Normal`、`Hard`、`Oni`、`Edit`、`Tower`、`Dan`或`0`～`6`的数值。\n`Tower`或`5`会使连打音符总是显示在其他音符前面。\n`Dan`或`6`会被识别为段位道场谱面。",
      paramDescription: "难度\n`Easy`、`Normal`、`Hard`、`Oni`、`Edit`、`Tower`、`Dan`或`0`～`6`的数值。"
    },
    level: {
      detail: "等级",
      documentation: "谱面的难度等级（星数）。",
      paramDescription: "等级（星数）"
    },
    balloon: {
      detail: "气球参数",
      documentation: "气球音符的打击数设定。\n按谱面中气球音符出现的顺序，用逗号分隔指定打击数。",
      paramDescription: "气球打击数（逗号分隔）"
    }
  }
};

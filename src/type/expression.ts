import { Range } from "vscode";
import { commands } from "../constants/commands";
import { headers } from "../constants/headers";
import { unionRanges } from "../util/vscode";
import { Token } from "./lexer";
import { Separator } from "./statement";

export class Expression {}

export class GlobalExpression extends Expression {
  readonly headers: HeaderExpression[] = [];
  readonly courses: CourseExpression[] = [];

  public getCourse(): CourseExpression {
    if (this.courses.length === 0) {
      this.courses.push(new CourseExpression());
    }
    return this.courses[this.courses.length - 1];
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const header of this.headers) {
      const headerRanges = header.getRange();
      if (headerRanges !== undefined) {
        ranges.push(headerRanges);
      }
    }
    for (const course of this.courses) {
      const courseRanges = course.getRange();
      if (courseRanges !== undefined) {
        ranges.push(courseRanges);
      }
    }
    return unionRanges(...ranges);
  }
}

export class HeaderExpression extends Expression {
  readonly name: TextExpression;
  readonly separator: Separator;
  rawParameter: TextExpression | undefined;
  readonly parameters: TextExpression[] = [];

  constructor(token: Token) {
    super();
    if (token.kind !== "Header") {
      throw new Error('TokenKind must be "Header".');
    }
    this.name = new TextExpression(token);
    const statement = headers.get(token.value);
    this.separator = statement?.separator ?? "Unknown";
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    ranges.push(this.name.range);
    if (this.rawParameter !== undefined) {
      ranges.push(this.rawParameter.range);
    }
    return unionRanges(...ranges);
  }
}

export class CommandExpression extends Expression {
  readonly name: TextExpression;
  readonly separator: Separator;
  rawParameter: TextExpression | undefined;
  readonly parameters: TextExpression[] = [];

  constructor(token: Token) {
    super();
    if (token.kind !== "Command") {
      throw new Error('TokenKind must be "Command".');
    }
    this.name = new TextExpression(token);
    const statement = commands.get(token.value);
    this.separator = statement?.separator ?? "Unknown";
  }

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    ranges.push(this.name.range);
    if (this.rawParameter !== undefined) {
      ranges.push(this.rawParameter.range);
    }
    return unionRanges(...ranges);
  }
}

export class CourseExpression extends Expression {
  readonly headers: HeaderExpression[] = [];
  readonly commands: CommandExpression[] = [];
  readonly charts: ChartExpression[] = [];

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const header of this.headers) {
      const headerRanges = header.getRange();
      if (headerRanges !== undefined) {
        ranges.push(headerRanges);
      }
    }
    for (const command of this.commands) {
      const commandRanges = command.getRange();
      if (commandRanges !== undefined) {
        ranges.push(commandRanges);
      }
    }
    for (const chart of this.charts) {
      const chartRanges = chart.getRange();
      if (chartRanges !== undefined) {
        ranges.push(chartRanges);
      }
    }
    return unionRanges(...ranges);
  }
}

export class ChartExpression extends Expression {
  start: CommandExpression | undefined;
  readonly measures: MeasureExpression[] = [];
  end: CommandExpression | undefined;

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    if (this.start !== undefined) {
      const startRanges = this.start.getRange();
      if (startRanges !== undefined) {
        ranges.push(startRanges);
      }
    }
    for (const measure of this.measures) {
      const measureRanges = measure.getRange();
      if (measureRanges !== undefined) {
        ranges.push(measureRanges);
      }
    }
    if (this.end !== undefined) {
      const endRanges = this.end.getRange();
      if (endRanges !== undefined) {
        ranges.push(endRanges);
      }
    }
    return unionRanges(...ranges);
  }
}

export class MeasureExpression extends Expression {
  readonly charts: (TextExpression | CommandExpression)[] = [];
  end: TextExpression | undefined;

  public getRange(): Range | undefined {
    const ranges: Range[] = [];
    for (const chart of this.charts) {
      if (chart instanceof TextExpression) {
        ranges.push(chart.range);
      } else if (chart instanceof CommandExpression) {
        ranges.push(chart.name.range);
        if (chart.rawParameter !== undefined) {
          ranges.push(chart.rawParameter.range);
        }
      }
    }
    return unionRanges(...ranges);
  }
}

export class TextExpression extends Expression {
  readonly value: string;
  readonly range: Range;

  constructor(token: Token) {
    super();
    this.value = token.value;
    this.range = token.range;
  }
}

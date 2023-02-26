import { IStatement, StatementCollection } from "./statement";

/**
 * 命令
 */
interface ICommand extends IStatement {}

interface ICommandRecord extends Record<string, ICommand> {
  readonly start: ICommand;
  readonly end: ICommand;
  readonly bpmchange: ICommand;
  readonly gogostart: ICommand;
  readonly gogoend: ICommand;
  readonly measure: ICommand;
  readonly scroll: ICommand;
  readonly delay: ICommand;
  readonly section: ICommand;
  readonly branchstart: ICommand;
  readonly branchend: ICommand;
  readonly n: ICommand;
  readonly e: ICommand;
  readonly m: ICommand;
  readonly levelhold: ICommand;
  readonly bmscroll: ICommand;
  readonly hbscroll: ICommand;
  readonly barlineoff: ICommand;
  readonly barlineon: ICommand;
  readonly lyric: ICommand;
  readonly sudden: ICommand;
  readonly direction: ICommand;
  readonly jposscroll: ICommand;
  readonly nextsong: ICommand;
  readonly judgedelay: ICommand;
  readonly dummystart: ICommand;
  readonly dummyend: ICommand;
  readonly notespawn: ICommand;
  readonly size: ICommand;
  readonly color: ICommand;
  readonly angle: ICommand;
  readonly gradation: ICommand;
  readonly barlinesize: ICommand;
  readonly resetcommand: ICommand;
}

export class CommandCollection extends StatementCollection<ICommand> {
  constructor(readonly items: ICommandRecord) {
    super(items);
  }
}

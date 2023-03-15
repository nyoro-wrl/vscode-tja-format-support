export class SortTextFactory {
  order1: number = 500;
  order2: number = 500;
  order3: number = 500;
  order4: number = 500;
  order5: number = 500;

  public toString(): string {
    return (
      String(this.order1).padStart(3, "0") +
      String(this.order2).padStart(3, "0") +
      String(this.order3).padStart(3, "0") +
      String(this.order4).padStart(3, "0") +
      String(this.order5).padStart(3, "0")
    );
  }
}

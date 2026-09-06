export class CrystalHeart {
  integrity: number;
  max: number;
  constructor(max: number) {
    this.max = max;
    this.integrity = max;
  }
  get ratio(): number {
    return this.integrity / this.max;
  }
}

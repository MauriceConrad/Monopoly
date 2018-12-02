const helper = require('../../helper');

class StringMatrix {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.initSize();


  }
  initSize(width = this.width, height = this.height) {
    this.matrix = new Array(height).fill(new Array(width).fill(" ").join(""));


  }
  get string() {
    return this.matrix.join("\n");
  }
  insert(x, y, str) {
    for (var i = 0; i < str.length; i++) {
      const lineIndex = i + y;
      const line = this.matrix[lineIndex];
      const newLinePart = str[i];



      const newLine = StringMatrix.replaceAtPos(line, newLinePart, x);

      this.matrix[lineIndex] = newLine;
    }
  }
  static replaceAtPos(str, replaceStr, index) {
    return str.substring(0, index) + replaceStr + str.substring(index + replaceStr.length);
  }
}

module.exports = StringMatrix;

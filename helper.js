

module.exports = {
  objFillDefaults(baseObj, template, arrayAsObj = false) {
    const obj = Object.assign({}, baseObj);
    for (var key in template) {
      if (template.hasOwnProperty(key)) {
        let prop = template[key];
        if (typeof prop == "object" && prop != null && (!arrayAsObj && !(prop instanceof Array))) {
          obj[key] = module.exports.objFillDefaults((obj[key] || (prop instanceof Array ? [] : {})), prop);
        }
        else if (!(key in obj)) {
          obj[key] = prop;
        }
      }
    }
    return obj;
  },
  arrayLast(array) {
    return array[array.length - 1];
  },
  splitWordsMaxLength(str, max) {
    //str = str.replace(/\s{1,}/g, " ");

    var words = [];
    while (str) {
      const nextWordPos = str.search(/\s/);
      if (nextWordPos < max && nextWordPos != -1) {
        words.push(str.substring(0, nextWordPos));
        str = str.substring(nextWordPos + 1);
      }
      else {
        words.push(str.substring(0, max));
        if (str.length >= max) {
          str = str.substring(max);
        }
        else {
          str = null;
        }
      }
    }
    return words;
  },
  wrapWords(str, maxLength) {

    const words = module.exports.splitWordsMaxLength(str, maxLength);

    const lines = [""];
    for (let word of words) {
      if (word.length + lines.last.length < maxLength) {
        lines[lines.length - 1] += (lines.last.length ? " " : "") + word;
      }
      else {
        lines.push(word);
      }
    }


    return lines.filter(line => line);
  },
  numberFromBits(bits) {
    var number = 0;
    for (var n = 0; n < bits.length; n++) {
      number += 2 ** n * bits[n];
    }
    return number;
  },
  fancyCount2(str){
    const joiner = "\u{200D}";
    const split = str.split(joiner);
    let count = 0;

    for(const s of split){
      //removing the variation selectors
      const num = Array.from(s.split(/[\ufe00-\ufe0f]/).join("")).length;
      count += num;
    }

    //assuming the joiners are used appropriately
    return count / split.length;
  },
  indexesOf(str, regex, start = 0) {
    const positions = [];

    while (str.substring(start).search(regex) > -1) {
      const pos = str.substring(start).search(regex) + start;
      positions.push(pos);
      start = pos + 1;
    }

    return positions;
  },
  indexesOfArray(array, item, start = 0) {
    const positions = [];

    while (array.indexOf(item, start) > -1) {
      const pos = array.indexOf(item, start);
      positions.push(pos);
      start = pos + 1;
    }

    return positions;
  },
  centerLine(line, width) {
    const centerSpace = (width - 1 - line.length) / 2;
    const space = [Math.trunc(centerSpace), Math.ceil(centerSpace)];

    return " ".repeat(space[0] >= 0 ? space[0] : 0) + line + " ".repeat(space[1] >= 0 ? space[1] : 0);
  }

};

Object.defineProperty(Array.prototype, "last", {
  get() {
    return module.exports.arrayLast(this);
  }
});

Array.prototype.indexOfKey = function(value, key, start = 0) {
  for (var i = start; i < this.length; i++) {
    if (this[i][key] === value) {
      return i;
    }
  }
  return -1;
}
Array.prototype.objectFromKey = function(value, key, start = 0) {
  var index = this.indexOfKey(value, key, start);
  var item = this[index];
  //item.__index = index;
  return item;
}

Math.randomNumber = function(start, end, round = false) {
  const number = start + (Math.random() * (end - start));
  return round ? Math.trunc(number) : number;
}

/*Object.defineProperty(String.prototype, "length", {
  get() {
    return fancyCount2(this);
  }
});*/

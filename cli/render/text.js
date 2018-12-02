const { wrapWords, numberFromBits, indexesOfArray, centerLine } = require('../../helper');
const StringMatrix = require('./StringMatrix');

const isBrowser = typeof window !== 'undefined';

const fieldTypeEmojis = {
  Station: field => "🚂",
  Police: field => "🚔🚨",
  Jail: field => "🔒👮",
  Action: field => ({
    chance: " ?",
    chest: "📦"
  })[field.kind],
  Start: field => "🚩",
  Tax: field => "💰",
  Company: field => ({
    electricity: "💡",
    water: "🚰"
  })[field.kind],
  Empty: field => "🚘"
};

const groupSymbols = ["🖤", "💠", "💜", "🧡", "🔴", "💛", "💚", "🔵"];

const pieceSymbols = ["🚎", "🐧", "🗿", "🚀", "🦄", "🎷", "🚁", "🎓"];

const buildingSymbols = {
  normal: "🏠",
  hotel: "🏰"
};


module.exports = function RenderText(game, options = {}) {
  const fieldSize = {
    width: 15,
    height: isBrowser ? 8 : 6
  };
  // There normally exist 4 sides
  const sides = 4;
  // Amount of fields per side (10) (Practically, it is 11 but important for the calculation is just 10)
  const fieldsPerSide = game.board.map.length / sides;

  const boardSize = {
    width: fieldSize.width * (fieldsPerSide + 1) + 1,
    height: fieldSize.height * (fieldsPerSide + 1) + 1
  };

  const size = {
    width: boardSize.width + 40,
    height: boardSize.height + options.interactions.length
  };
  const matrix = new StringMatrix(size.width, size.height);

  drawBg();

  // Draw each field
  for (let i = 0; i < game.board.map.length; i++) {
    drawField(i);
  }

  // Re-draw the corner fields becaus etheir borders are overwritten by the following that does not thinks about the 2nd last field (which is always connected to it)
  for (let i = 0; i < game.board.map.length; i += fieldsPerSide) {
    drawField(i);
  }

  // Re-draw the focused field to overwrite the over-drawed bold border (that now is thin)
  // The field that will be drawn next to a bold one always over-draws the old bold boder with its thin border
  drawField(options.focus);


  drawCards({
    x: fieldSize.width + 2,
    y: fieldSize.height + 1,
    width: 35,
    height: 10,
    // Vertical centering with empty lines
    text: new Array().concat(new Array(Math.ceil((10 - 2 - 6) / 2)).fill(""), [
      "  ___  ",
      " |__ \\ ",
      "    ) |",
      "   / / ",
      "  |_|  ",
      "  (_)  "
    ], new Array(Math.trunc((10 - 2 - 6) / 2)).fill(""))
  });
  drawCards({
    x: -(fieldSize.width + 2),
    y: -(fieldSize.height + 1),
    width: 35,
    height: 10,
    // Vertical centering with empty lines
    text: new Array().concat(new Array(Math.ceil((10 - 2 - 8) / 2)).fill(""), (game.currentAction && false) ? [
      "",
      "",
      "",
      "",
      game.currentAction.action.message,
      "",
      "",
      ""
    ] : ([
      "  __________  ",
      " /\\____;;___\\ ",
      "| /         / ",
      "`. ())oo() .  ",
      " |\\(%()*^^()^\\",
      " | |-%-------|",
      " \\ |%________|",
      "  \\|%________|"
    ]), new Array(Math.trunc((10 - 2 - 8) / 2)).fill(""))
  });

  drawSelectedField();

  drawInteractionsList(options.interactions);

  var currY = 0;
  var currRow = 0;

  for (var i = 0; i < game.teams.length; i++) {
    drawTeam(game.teams[i], i);
  }


  function drawTeam(team, index) {
    const width = 30;

    const horizontalBorder = "─".repeat(width - 2);

    const ownedLines = team.fields.map(field => {
      return "│" + centerLine((groupSymbols[field.group] || fieldTypeEmojis[field.type](field)) + " " + field.name, width - 1) + "│";
    });

    const lines = [
      "┌" + horizontalBorder + "┐",
      "│" + centerLine("Team " + (team.index + 1) + " " + pieceSymbols[team.index], width - 1) + "│",
      "├" + horizontalBorder + "┤",
      "│" + " ".repeat(width - 2) + "│",
    ].concat(ownedLines, [
      "│" + " ".repeat(width - 2) + "│",
      "├" + horizontalBorder + "┤",
      "│" + centerLine("$" + team.wallet, width - 1) + "│",
      '└' + horizontalBorder + '┘'
    ]);

    const maxHeight = boardSize.height;

    const height = lines.length;

    if (currY + height > maxHeight) {
      currY = 0;
      currRow++;
    }

    matrix.insert(boardSize.width + (currRow * width) + 0, currY, lines);

    currY += height;
  }

  function drawBg() {

    const lines = [
      ' ___      ___     ______    _____  ___      ______    _______    ______    ___       ___  ___  ',
      '|"  \\    /\"  |   /    \" \\  (\\\"   \\|\"  \     /    \" \\  |   __ \"\\  /    \" \\  |\"  |     |\"  \\/\"  | ',
      ' \\   \\  //   |  // ____  \\ |.\\\\   \\    |  // ____  \\ (. |__) :)// ____  \\ ||  |      \\   \\  /  ',
      ' /\\\\  \\/.    | /  /    ) :)|: \\.   \\\\  | /  /    ) :)|:  ____//  /    ) :)|:  |       \\\\  \\/   ',
      '|: \\.        |(: (____/ // |.  \\    \\. |(: (____/ // (|  /   (: (____/ //  \\  |___    /   /    ',
      '|.  \\    /:  | \\        /  |    \\    \\ | \\        / /|__/ \\   \\        /  ( \\_|:  \\  /   /     ',
      '|___|\\__/|___|  \\\"_____/    \\___|\____\\)   \\\"_____/ (_______)   \\\"_____/    \\_______)|___/      '
    ];

    const width = lines[0].length;
    const height = lines.length;

    const x = Math.round(((fieldsPerSide + 1) * fieldSize.width) / 2 - width / 2);
    const y = Math.round(((fieldsPerSide + 1) * fieldSize.height) / 2 - height / 2);

    matrix.insert(x, y, lines);
  }

  function drawSelectedField() {
    const field = game.board.map[options.focus];

    const width = 38;

    const horizontalBorder = "─".repeat(width - 2);

    const symbolLineSpace = isBrowser ? (width - 6) : (width - 2);

    const symbolLine = (groupSymbols[field.group] || fieldTypeEmojis[field.type](field) || " ").repeat(symbolLineSpace).substring(0, symbolLineSpace);

    var lines = {
      get Street() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + symbolLine + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + centerLine(field.level < 5 ? buildingSymbols.normal.repeat(field.level) : field.level ? buildingSymbols.hotel : "", width - 1) + "│",
          "├" + horizontalBorder + "┤",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Rent $" + field.baseRent, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 1 " + buildingSymbols.normal + " $" + field.getRent(1), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 2 " + buildingSymbols.normal + " $" + field.getRent(2), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 3 " + buildingSymbols.normal + " $" + field.getRent(3), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 4 " + buildingSymbols.normal + " $" + field.getRent(4), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With " + buildingSymbols.hotel + " $" + field.getRent(5), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("─".repeat(width - 8), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Houses (" + buildingSymbols.normal + ") cost $" + field.buildingCost, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Hotels (" + buildingSymbols.hotel + ") cost $" + field.buildingCost + " + 4 " + buildingSymbols.normal + "", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Action() {

        return true ? ":" : ({
          chance: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("  _.--,-```-.    ", width - 1) + "│",
            "│" + centerLine(" /    /      '.  ", width - 1) + "│",
            "│" + centerLine("/  ../         ; ", width - 1) + "│",
            "│" + centerLine("\\  ``\\  .``-    '", width - 1) + "│",
            "│" + centerLine(" \\ ___\\/    \\   :", width - 1) + "│",
            "│" + centerLine("       \\    :   |", width - 1) + "│",
            "│" + centerLine("       |    ;  . ", width - 1) + "│",
            "│" + centerLine("      ;   ;   :  ", width - 1) + "│",
            "│" + centerLine("     /   :   :   ", width - 1) + "│",
            "│" + centerLine("     `---'.  |   ", width - 1) + "│",
            "│" + centerLine("      `--..`;    ", width - 1) + "│",
            "│" + centerLine("    .--,_        ", width - 1) + "│",
            "│" + centerLine("    |    |`.     ", width - 1) + "│",
            "│" + centerLine("    `-- -`, ;    ", width - 1) + "│",
            "│" + centerLine("      '---`\"     ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            '└' + horizontalBorder + '┘'
          ],
          chest: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("                  _.--.          ", width - 1) + "│",
            "│" + centerLine("              _.-'_:-'||         ", width - 1) + "│",
            "│" + centerLine("          _.-'_.-::::'||         ", width - 1) + "│",
            "│" + centerLine("     _.-:'_.-::::::'  ||         ", width - 1) + "│",
            "│" + centerLine("   .'`-.-:::::::'     ||         ", width - 1) + "│",
            "│" + centerLine(" /.'`;|:::::::'      ||_         ", width - 1) + "│",
            "│" + centerLine("||   ||::::::'     _.;._'-._     ", width - 1) + "│",
            "│" + centerLine("||   ||:::::'  _.-!oo @.!-._'-.  ", width - 1) + "│",
            "│" + centerLine(" \\'.  ||:::::.-!()oo @!()@.-'_.| ", width - 1) + "│",
            "│" + centerLine("   '.'-;|:.-'.&$@.& ()$%-'o.\\||", width - 1) + "│",
            "│" + centerLine("     `>'-.!@%()@'@_%-'_.-o_|'||", width - 1) + "│",
            "│" + centerLine("     ||-._'-.@.-'_.-' _.-o |'|| ", width - 1) + "│",
            "│" + centerLine("     ||=[ '-._.-\\U/.-'    o |'|| ", width - 1) + "│",
            "│" + centerLine("     || '-.]=|| |'|      o  |'|| ", width - 1) + "│",
            "│" + centerLine("     ||      || |'|        _| '; ", width - 1) + "│",
            "│" + centerLine("     ||      || |'|    _.-'_.-'  ", width - 1) + "│",
            "│" + centerLine("     |'-._   || |'|_.-'_.-'      ", width - 1) + "│",
            "│" + centerLine("      '-._'-.|| |'`_.-'          ", width - 1) + "│",
            "│" + centerLine("        '-.||_/.-'               ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            '└' + horizontalBorder + '┘'
          ]
        }[field.kind]);
      },
      get Tax() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + symbolLine + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "├" + horizontalBorder + "┤",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("       $$$$$      ", width - 1) + "│",
          "│" + centerLine("       $:::$      ", width - 1) + "│",
          "│" + centerLine("   $$$$$:::$$$$$$ ", width - 1) + "│",
          "│" + centerLine(" $$::::::::::::::$", width - 1) + "│",
          "│" + centerLine("$:::::$$$$$$$::::$", width - 1) + "│",
          "│" + centerLine("$::::$       $$$$$", width - 1) + "│",
          "│" + centerLine("$::::$            ", width - 1) + "│",
          "│" + centerLine("$::::$            ", width - 1) + "│",
          "│" + centerLine("$:::::$$$$$$$$$   ", width - 1) + "│",
          "│" + centerLine(" $$::::::::::::$$ ", width - 1) + "│",
          "│" + centerLine("   $$$$$$$$$:::::$", width - 1) + "│",
          "│" + centerLine("            $::::$", width - 1) + "│",
          "│" + centerLine("            $::::$", width - 1) + "│",
          "│" + centerLine("$$$$$       $::::$", width - 1) + "│",
          "│" + centerLine("$::::$$$$$$$:::::$", width - 1) + "│",
          "│" + centerLine("$::::::::::::::$$ ", width - 1) + "│",
          "│" + centerLine(" $$$$$$:::$$$$$   ", width - 1) + "│",
          "│" + centerLine("      $:::$       ", width - 1) + "│",
          "│" + centerLine("      $$$$$       ", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine(fieldTypeEmojis[field.type](field) + " $" + field.price, width - 1) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Station() {
        return [
          "┌" + horizontalBorder + "┐",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine(field.name, width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("    e@@@@@@@@@@@@@@@ ", width - 1) + "│",
          "│" + centerLine("   @@@\"\"\"\"\"\"\"\"\"\"     ", width - 1) + "│",
          "│" + centerLine("  @\" ___ ___________ ", width - 1) + "│",
          "│" + centerLine(" II__[w] | [i] [z] | ", width - 1) + "│",
          "│" + centerLine("{======|_|~~~~~~~~~| ", width - 1) + "│",
          "│" + centerLine("/oO--000'\"`-OO---OO-'", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("Rent", width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("With 1 station  $" + field.getRent(1), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(2), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(3), width - 1) + "│",
          "│" + centerLine("With 2 stations $" + field.getRent(4), width - 1) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + " ".repeat(width - 2) + "│",
          "│" + centerLine("$" + field.price, width - 1) + "│",
          '└' + horizontalBorder + '┘'
        ];
      },
      get Company() {
        return {
          electricity: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine(field.name, width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("        ___        ", width - 1) + "│",
            "│" + centerLine("    .-\"`   `\"-.    ", width - 1) + "│",
            "│" + centerLine("  .'           '.  ", width - 1) + "│",
            "│" + centerLine(" /               \\ ", width - 1) + "│",
            "│" + centerLine("/  #              \\", width - 1) + "│",
            "│" + centerLine("| #               |", width - 1) + "│",
            "│" + centerLine("|                 |", width - 1) + "│",
            "│" + centerLine(";     .-~~~-.     ;", width - 1) + "│",
            "│" + centerLine(" ;     )   (     ; ", width - 1) + "│",
            "│" + centerLine("  \\   (     )   /  ", width - 1) + "│",
            "│" + centerLine("   \\   \\   /   /   ", width - 1) + "│",
            "│" + centerLine("    \\   ) (   /    ", width - 1) + "│",
            "│" + centerLine("     |  | |  |     ", width - 1) + "│",
            "│" + centerLine("     |__|_|__|     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + centerLine("     }======={     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + centerLine("     }======={     ", width - 1) + "│",
            "│" + centerLine("     {=======}     ", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("Rent $ 4 * moved steps", width - 1) + "│",
            "│" + centerLine("Both companies $ 10 * moved steps", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("$" + field.price, width - 1) + "│",
            '└' + horizontalBorder + '┘'
          ],
          water: [
            "┌" + horizontalBorder + "┐",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine(field.name, width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("        T              ", width - 1) + "│",
            "│" + centerLine("    ⊕───┴───⊕          ", width - 1) + "│",
            "│" + centerLine("       │ │             ", width - 1) + "│",
            "│" + centerLine("      ╱___╲            ", width - 1) + "│",
            "│" + centerLine(",────┤─────├───────.   ", width - 1) + "│",
            "│" + centerLine("│        -    -     ╲  ", width - 1) + "│",
            "│" + centerLine("`────/_____\\────.    ╲ ", width - 1) + "│",
            "│" + centerLine("       ───       ╲    │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │   │", width - 1) + "│",
            "│" + centerLine("                  │___│", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("Rent $ 4 * moved steps", width - 1) + "│",
            "│" + centerLine("Both companies $ 10 * moved steps", width - 1) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + " ".repeat(width - 2) + "│",
            "│" + centerLine("$" + field.price, width - 1) + "│",
            '└' + horizontalBorder + '┘'
          ]
        }[field.kind];
      }
    }[field.type];

    if (!lines) {
      return;
    }

    //lines = new Array(20).fill("🖤".repeat(20 - 2).substring(0, 20 - 2));

    const height = lines.length;

    const x = Math.round(((fieldsPerSide + 1) * fieldSize.width) / 2 - width / 2);
    const y = Math.round(((fieldsPerSide + 1) * fieldSize.height) / 2 - height / 2);



    matrix.insert(x, y, lines);

    setTimeout(function() {
      //console.log(x, y);
    })

  }


  function drawInteractionsList(interactions) {
    matrix.insert(0, fieldSize.height * (fieldsPerSide + 1) + 1, interactions);
  }

  function drawCards(options) {
    var { x, y, width, height, text } = options;
    // Invert negative coordinates to be offset from right border
    x = (boardSize.width + x) % boardSize.width - width * (x < 0);
    // Invert negative coordinates to be offset from bottom border
    y = (boardSize.height + y) % boardSize.height - height * (y < 0);

    const horizontalBorder = '─'.repeat(width - 2);
    const space = ' '.repeat(width - 2);

    const lines = new Array().concat('┌' + horizontalBorder + '┐',
          new Array(height - 2).fill('│' +      space       + '│'),
                                     '└' + horizontalBorder + '┘');

   matrix.insert(x, y, lines);

   matrix.insert(x + 1, y + 1, text.map(line => {
     return centerLine(line, width - 2);
   }));
  }

  function drawField(i) {
    const field = game.board.map[i];
    // Getting the relative index of current field within its side
    const relIndex = i % fieldsPerSide;
    // Getting the index of the side, the field is a part of
    const side = Math.trunc(i / fieldsPerSide);

    const relPos = {
      x: !(side % 2) ? fieldSize.width * fieldsPerSide * !!side : relIndex * fieldSize.width,
      y: side % 2 ? fieldSize.height * fieldsPerSide * !(side % 3) : relIndex * fieldSize.height
    };

    // Relative positions for each side
    const relPositions = [
      {
        x: 0,
        y: (fieldsPerSide - relIndex) * fieldSize.height
      },
      {
        x: relIndex * fieldSize.width,
        y: 0
      },
      {
        x: fieldsPerSide * fieldSize.width,
        y: relIndex * fieldSize.height
      },
      {
        x: (fieldsPerSide - relIndex) * fieldSize.width,
        y: fieldsPerSide * fieldSize.height
      }
    ];


    const currPos = relPositions[side];


    const borderingSides = getBorderingSides(i, side);

    matrix.insert(currPos.x, currPos.y, getField(i, borderingSides));


    const fieldNameWrapped = wrapWords(getFieldName(field), fieldSize.width - 1);
    // Concat specific emoji as own line to wrapped name lines
    const fieldTypeSymbol = field.type in fieldTypeEmojis ? fieldTypeEmojis[field.type](field) : "";

    const fieldDescriptionWrapped = wrapWords(field.description || "", fieldSize.width - 1);

    var fieldTitleLines = [
      (field.level < 5 ? buildingSymbols.normal.repeat(Math.trunc((field.level || 0) / 2)) : "") + (groupSymbols[field.group] || "") + (field.level < 5 ? buildingSymbols.normal.repeat(Math.ceil((field.level || 0) / 2)) : (field.level ? buildingSymbols.hotel : "")),
    ].concat(fieldNameWrapped, fieldTypeSymbol, fieldDescriptionWrapped);
    // Filter title lines for invalid ones (undefined)
    fieldTitleLines = fieldTitleLines.filter(line => line)

    const fieldHeight = fieldSize.height - 1;
    // Fill up lines to bottom
    for (let i = fieldTitleLines.length; i < fieldHeight; i++) fieldTitleLines.push("");

    // Write price of current field to last line (bottom)
    const priceLineIndex = getLastEmptyIndex(fieldTitleLines, 0);
    fieldTitleLines[priceLineIndex] = getFieldPrice(field) || fieldTitleLines[priceLineIndex];

    // Write pieces of current field to second last line
    const piecesLineIndex = getLastEmptyIndex(fieldTitleLines, 1);
    const piecesLines = getFieldPieces(field);
    fieldTitleLines[piecesLineIndex] = (piecesLines[0] || [""]).join(" ") || fieldTitleLines[piecesLineIndex];

    // Center each line
    fieldTitleLines = fieldTitleLines.map(line => centerLine(line, fieldSize.width));

    matrix.insert(currPos.x + 1, currPos.y + 1, fieldTitleLines);
  }

  function getLastEmptyIndex(array, lastAlternativeIndex = 0) {
    for (var i = array.length - 1; i >= 0; i--) {
      if (!array[i]) {
        return i;
      }
    }
    return array.length - 1 - lastAlternativeIndex;
  }

  function getFieldPrice(field) {
    return "price" in field ? ("$" + field.price.toString()) : "";
  }

  function getFieldPieces(field) {
    // Indexes of all pieces that are currently staying on this field
    // (Getting all pieces whose index is the current field's index)
    const pieceStayingIndexes = indexesOfArray(options.pieces, field.index);

    const maxPiecesPerLine = (fieldSize.width - 2) / 3;
    const lines = new Array(Math.ceil(pieceStayingIndexes.length / maxPiecesPerLine)).fill(true).map((val, index) => {
      const pieces = pieceStayingIndexes.slice(index * maxPiecesPerLine, (index + 1) * maxPiecesPerLine);
      return pieces.map(pieceIndex => pieceSymbols[pieceIndex]);
    });

    return lines;
  }

  function getFieldName(field) {
    const fieldTypeSymbol = field.type in fieldTypeEmojis ? fieldTypeEmojis[field.type](field) : "";
    return (field.name || "") + "" //+ fieldTypeSymbol;
  }

  function getBorderingSides(index, side) {
    const lastField = index ? game.board.map[index - 1] : game.board.map.last;
    const nextField = index < game.board.map.length - 1 ? game.board.map[index + 1] : game.board.map[0];

    // Getting the index of the side, the last field is a part of
    const lastFieldSideIndex = Math.trunc(lastField.index / fieldsPerSide);
    // Getting the index of the side, the next field is a part of
    const nextFieldSideIndex = Math.trunc(nextField.index / fieldsPerSide);

    // List of normal (!) bordering sides for each side
    // First item of both side sis the one, the direction is drawing to
    const fieldSideBorders = [
      [0, 2],
      [1, 3],
      [2, 0],
      [3, 1]
    ];
    // Get bordering sides for last field
    const borderingSides = fieldSideBorders[lastFieldSideIndex];

    // Get the difference between current field's side and the last field one's (If 0, the field is straight on the way, if 1, there was a changing of side)
    const lastSideDiff = side - lastFieldSideIndex;

    // The side changing difference is added to the first side index within the list of bordering fields (the first rotates)
    borderingSides[0] += lastSideDiff;

    return new Array(4).fill(false).map((sideValue, sideIndex) => borderingSides.includes(sideIndex));
  }

  function getField(index, sides) {


    /*
      NOTE
      Each char identifier represents the binary result of the both related sides (they are 1 if there lies a field on and 0 if not)
      The array 'sides' contains the list of all sides (top, right, bottom, left) and wether there is field surrounding

    */

    // Return list of all matching cases for the field (e.g. focused field) that "are the case"
    const charCases = (() => {
      const modifiersBoolean = {
        // Default case is always true
        default: true,
        // Focused case is true if the field's index is equal to the focused index
        focused: options.focus === index
      };
      return Object.keys(modifiersBoolean).filter(modifierName => modifiersBoolean[modifierName]);
    })();

    // Because we can only use one case , use the last one (Except 'default' there should not exist any other case)
    const charMode = charCases.last;


    const corners = [
      {
        relatedSides: [0, 3],
        0b00: {
          default: "┌",
          focused: "┏"
        },
        0b10: {
          default: "┬",
          focused: "┲"
        },
        0b01: {
          default: "├",
          focused: "┢"
        },
        0b11: {
          default: "┼",
          focused: "╆"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [0, 1],
        0b00: {
          default: "┐",
          focused: "┓"
        },
        0b10: {
          default: "┬",
          focused: "┱"
        },
        0b01: {
          default: "┤",
          focused: "┪"
        },
        0b11: {
          default: "┼",
          focused: "╅"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [1, 2],
        0b00: {
          default: "┘",
          focused: "┛"
        },
        0b10: {
          default: "┤",
          focused: "┩"
        },
        0b01: {
          default: "┴",
          focused: "┹"
        },
        0b11: {
          default: "┼",
          focused: "╃"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      },
      {
        relatedSides: [2, 3],
        0b00: {
          default: "└",
          focused: "┗"
        },
        0b10: {
          default: "┴",
          focused: "┺"
        },
        0b01: {
          default: "├",
          focused: "┡"
        },
        0b11: {
          default: "┼",
          focused: "╄"
        },
        get char() {
          return this[this.charIdentifier][charMode];
        }
      }
    ];

    for (let corner of corners) {
      // Get the related sides boolean values from the original 'sides' array
      // There always exist 4 sides [top, right, bottom, left] that are true or false but each corner just need two specific sides to decide which char is used
      const relatedSides = corner.relatedSides.map(sideIndex => sides[sideIndex]); // Now has length of 2

      // Char identifier is the binary number that results from interpreting each side's boolean value (true | false) as bit
      const charIdentifier = numberFromBits(relatedSides);

      corner.charIdentifier = charIdentifier;
    }

    const borderChars = {
      horizontal: {
        default: "─",
        focused: isBrowser ? "─" : "━"
      },
      vertical: {
        default: "│",
        focused: "┃"
      }
    };

    const borderLine = "" + borderChars.horizontal[charMode].repeat(fieldSize.width - 1);
    const innerSpace = " ".repeat(fieldSize.width - 1);

    return [corners[0].char + borderLine + corners[1].char].concat(
           new Array(fieldSize.height - 1).fill(borderChars.vertical[charMode] + innerSpace + borderChars.vertical[charMode]))
           .concat([corners[3].char + borderLine + corners[2].char]);
  }

  return matrix.string;

};

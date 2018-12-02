# Monopoly

```bash
npm install monopolygame
```

## CLI

### Install globally

```bash
npm install monopolygame -g
```

### Run

```bash
$ monopolygame --teams 2 --wallet 40000
```

![Preview](https://i.postimg.cc/qqmy5d5b/Bildschirmfoto-2018-12-02-um-20-00-49.png)

## Require

```javascript
const Monopoly = require('monopolygame');
```

## Usage

```javascript
const myGame = new Monopoly({
  board: {
    map: [Array], // Optional. Do not use by default
    fields: [Object], // Optional. Do not use by default
    actions: [Array], // Optional. Do not use by default
  },
  teams: 2
});
```

### Map

`map` is an array template that contains a list of fields. By default, do not set your own template.
Each *field* contains it's `type` that should be the name of a class that is included within `fields` (More below).
The `detail` property contains specific properties that dependent from the `type` of field.


By default, the `MonpolyBoard.BOARD_DEFAULT_EN` will be used as map. This array is read from `default/BOARD_EN.json`. Therefore, just have a look at this file to understand ;-)

###### Example

```javascript
[
  {
    type: "Start", // Class name that refers to `Start` class within 'fields'
    detail: {
      // Type specific properties such as name and description
      name: "Go",
      description: "Collect 200 $ salary as you pass"
    }
  },
  {
    type: "Street", // Class name that refers to `Street` class within 'fields'
    detail: {
      // Type specific properties such as name, price and group
      name: "Old Kent Road",
      price: 60,
      group: 0
    }
  },
  {
    type: "Action", // Class name that refers to `Action` class within 'fields'
    detail: {
      // Type specific properties such as kind
      kind: "chest"
    }
  }
  ...
]
```

### Fields

To make the specific `type`'s working, they have to refer to **real** class. This classes are stored as properties within the `fields` object.

By default, the object `MonopolyBoard.FIELDS_DEFAULT` will be used here which looks like this:

```javascript
{
  Start: require('./fields/FieldStart'),
  Street: require("./fields/FieldStreet"),
  Action: require("./fields/FieldAction"),
  Tax: require("./fields/FieldTax"),
  Station: require("./fields/FieldStation"),
  Jail: require("./fields/FieldJail"),
  Company: require("./fields/FieldCompany"),
  Empty: require("./fields/FieldEmpty"),
  Police: require("./fields/FieldPolice")
}
```

As you can see, it requires each field types related class from an own file.

Each field class that is required here, `extends` the original `Field` class from `fields/Field.js`.

### Get Group

```javascript
// Returns all fields that belong to the specific group (id)
const firstGroup = myBoard.getGroup(0);
```

#### Own Field Type

If you want to add any type of field, just use an object as `fields` property that includes your own field class. Please just make your own class `extending` the original `Field` ;-)

## Field Class

Each *field* is an instance of the general `fields/Field.js` class and the type-specific class as `fields/FieldStreet.js`.

A field base object (as the ones within `default/BOARD_EN.json`) looks like the following:
```json
{
  "type": "Street",
  "detail": {
    "name": "Old Kent Road",
    "price": 60,
    "baseRent": 2,
    "group": 0
  }
}
```

- `type` defines the class that will be used to initialize the field
- `detail` contains some field-specific properties
  - `name` is just the name of the street
  - `price` is the base price for the street
  - `baseRent` is the base rent of the street (without buildings)
  - `group` is the index of the related group (Each street is related to a (colored) group)

### collection

```javascript
// Returns the group / collection the field belongs to
const myCollection = myField.collection;
```

### Own of Collection

```javascript
// Returns all fields of their collection that are owned by a given team
const ownFields = myField.ownOfCollection(myTeam);
```

### Collection Owner

```javascript
// Returns the team that owns the collection of 'myField'
// If no team owns all fields of myField's collection -> null
const ownerOfMyCollection = myField.collectionOwner;
```

### owner

Exists in `Street`, `Company` & `Station`.

`owner` describes the team that owns the field. This is a `Team` instance.

```javascript
const owner = myField.owner;
```

### level

Exists in `Street`.

`level` describes the building of the field from `0-4`.

```javascript
const level = myField.level;
```

### enter()

Each field has an own `enter()` method that gets applied when a piece enters the field.
`enter()` returns a `next` object that describes the next game actions.

E.g. the `enter()` method of the `FieldStreet` class.
```javascript
enter(team) {
  return {
    purchase: !this.owner,
    // If the entered field's owner is not the current team, return a payment literal
    payment: this.owner && this.owner != team ? ({
      creditor: this.owner, // Team to pay to
      debtor: team, // The team that has to pay
      amount: this.rent // Amount to pay
    }) : undefined,
    building: team === this.owner,
    tax: undefined
  };
}

```
#### Example Field Class

For example, to

## Pieces

Each `board` instance has an `pieces` array that describes the pieces on the board.

A `piece` object returns a position index and the related field:

```javascript
{
  position: 0,
  field: <Getter>
}
```

## Teams

Each `game` instance has a `teams` array that contains each team represented by an instance of `Team` (`Team.js`).

```javascript
const myTeam = myGame.teams[0];
```

### piece

```javascript
// Returns the piece object that belongs to me
const myTeamsPiece = myTeam.piece;
```

### fields

```javascript
// Returns all fields that belongs to me
const myFields = myTeam.fields;
```


### wallet

```javascript
// Returns my money
const myMoney = myTeam.wallet;
```

### move()

```javascript
// Moves 6 fields
myTeam.move(6);
```

### moveTo()

```javascript
// Move to specific 'myField'
myTeam.moveTo(myField);
```

### buy()

```javascript
// Buy `myField` (Instance of a field on the board)
myTeam.buy(myField);
```

### transaction()

```javascript
// Pays $ 500 to 'otherTeam' (Instance of Team)
myTeam.transaction(otherTeam, 500);
```

### payTax()

```javascript
// Pays $ 500 as tax
myTeam.payTax(500);
```

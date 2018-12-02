

class Field {
  constructor(details, board) {
    // Set refernece to board, field lies on
    this.__board = board;

    // Append each property of 'details' directly to the field instance
    for (var key in details) {
      if (details.hasOwnProperty(key)) {
        this[key] = details[key];
      }
    }
  }
  get collection() {
    return this.__board.getGroup(this.group);
  }
  // Returns all fields of their collection that are owned by a given owner
  ownOfCollection(owner) {
    return this.collection.filter(field => field.owner == owner);
  }
  // Returns (if possible), the single owner of the whole collection | If the collection is not owned by a single team, return null
  get collectionOwner() {
    return this.ownOfCollection(this.collection[0].owner).length == this.collection.length ? this.collection[0].owner : null;
  }
}
module.exports = Field;

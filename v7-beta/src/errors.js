// A rule said no (not enough Gold, wrong week...). The UI shows the message; anything else thrown is a bug.
export class Refused extends Error {
  constructor(message) {
    super(message);
    this.name = 'Refused';
  }
}

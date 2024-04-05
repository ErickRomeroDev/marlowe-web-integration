export const variable = 2;

export class Person {
  name: string;
  age: number;

  // Constructor with type annotations for parameters
  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // Method to display information about the person
  describe(): string {
    return `${this.name} is ${this.age} years old.`;
  }
}

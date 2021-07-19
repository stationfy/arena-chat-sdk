import { User } from "src"

describe('User', () => {
  test('should return the user instance', () => {
    const instance = User.instance;

    expect(instance).toBeInstanceOf(User);
  })
})

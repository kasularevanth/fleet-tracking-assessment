declare module 'otp-generator' {
  interface GenerateOptions {
    upperCaseAlphabets?: boolean;
    lowerCaseAlphabets?: boolean;
    specialChars?: boolean;
    digits?: boolean;
  }

  interface OtpGenerator {
    generate(length: number, options?: GenerateOptions): string;
  }

  const otpGenerator: OtpGenerator;
  export default otpGenerator;
}


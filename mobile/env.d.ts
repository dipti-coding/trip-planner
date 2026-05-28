declare module 'react-native-config' {
  interface NativeConfig {
    LOCAL_API_URL: string;
    TEST_EMAIL: string;
    TEST_PWD: string;
  }
  export const Config: NativeConfig;
  export default Config;
}

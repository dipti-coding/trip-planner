declare module 'react-native-config' {
  interface NativeConfig {
    LOCAL_API_URL: string;
  }
  export const Config: NativeConfig;
  export default Config;
}

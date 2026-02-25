declare module 'qz-tray' {
  interface PrintData {
    type: 'raw' | 'pixel'
    format: 'plain' | 'base64' | 'hex' | 'file' | 'image' | 'html' | 'pdf'
    data: string
  }

  interface QZ {
    websocket: {
      connect: (options?: { host?: string; port?: number }) => Promise<void>
      disconnect: () => Promise<void>
      isActive: () => boolean
    }
    printers: {
      find: (query?: string) => Promise<string | string[]>
    }
    configs: {
      create: (
        printer: string,
        options?: {
          encoding?: string
          copies?: number
          altPrinting?: boolean
          [key: string]: unknown
        }
      ) => unknown
    }
    print: (config: unknown, data: string[] | PrintData[]) => Promise<void>
  }

  const qz: QZ
  export default qz
}

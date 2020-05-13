

export class FileUtils {

    public static getExtensionFromName(filename: string): string | undefined {
        return filename.split('.').pop()?.trim();
    }
}
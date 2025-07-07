import http from '@/api/http';
import { IValheimMod, rawDataToValheimMod } from '@/api/server/valheim/fetchMods';

export interface ValheimInstalledModsResponse {
    mods: IValheimMod[];
}

export default async (uuid: string): Promise<ValheimInstalledModsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/valheim/installed`);

    return {
        mods: (data.mods || []).map(rawDataToValheimMod),
    };
};

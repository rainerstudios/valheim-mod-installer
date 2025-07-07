import http from '@/api/http';
import { IValheimMod, rawDataToValheimMod } from '@/api/server/valheim/fetchMods';

export interface ValheimModsResponse {
    mode: 'vanilla' | 'bepinex';
    installing: undefined | IValheimMod;
    installingStatus: undefined | 'failed' | 'downloading';
}

export default async (uuid: string): Promise<ValheimModsResponse> => {
    const { data } = await http.get(`/api/client/servers/${uuid}/valheim`);

    return {
        mode: data.mode,
        installing: data.installing === null ? undefined : rawDataToValheimMod(data.installing),
        installingStatus: data.installing_status === null ? undefined : data.installing_status,
    };
};

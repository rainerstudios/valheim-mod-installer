import http from '@/api/http';

export default (uuid: string, modUuid4: string, versionUuid4: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/valheim/mods/${modUuid4}/versions/${versionUuid4}/install`)
            .then((data) => {
                resolve(data.data || []);
            })
            .catch(reject);
    });
};

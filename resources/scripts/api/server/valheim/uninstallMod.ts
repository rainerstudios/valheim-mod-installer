import http from '@/api/http';

export default (uuid: string, modUuid4: string): Promise<any> => {
    return new Promise((resolve, reject) => {
        http.post(`/api/client/servers/${uuid}/valheim/mods/${modUuid4}/uninstall`)
            .then((data) => {
                resolve(data.data || []);
            })
            .catch(reject);
    });
};

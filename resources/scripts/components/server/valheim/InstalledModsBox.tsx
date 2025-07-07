import React, { useEffect, useState } from 'react';
import { ServerContext } from '@/state/server';
import fetchInstalledMods from '@/api/server/valheim/fetchInstalledMods';
import { useFlashKey } from '@/plugins/useFlash';
import { IValheimMod } from '@/api/server/valheim/fetchMods';
import tw from 'twin.macro';
import InstalledModBox from '@/components/server/valheim/InstalledModBox';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [installedMods, setInstalledMods] = useState<IValheimMod[]>([]);

    const { clearAndAddHttpError, clearFlashes } = useFlashKey('server:valheim:mods');

    const loadInstalledMods = () => {
        clearFlashes();

        fetchInstalledMods(uuid)
            .then((data) => setInstalledMods(data.mods))
            .catch((error) => clearAndAddHttpError(error));
    };

    useEffect(() => {
        loadInstalledMods();
    }, []);

    return (
        <>
            {installedMods.length > 0 && (
                <div>
                    <div css={tw`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2`}>
                        {installedMods.map((mod) => (
                            <InstalledModBox mod={mod} key={`mod-${mod.uuid4}`} onUpdate={() => loadInstalledMods()} />
                        ))}
                    </div>
                </div>
            )}
            {installedMods.length < 1 && <p css={tw`text-center text-sm text-neutral-400`}>There are no mods resulted for your query.</p>}
        </>
    );
};

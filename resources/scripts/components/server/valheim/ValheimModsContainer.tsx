import React, { useEffect, useState } from 'react';
import ServerContentBlock from '@/components/elements/ServerContentBlock';
import { useFlashKey } from '@/plugins/useFlash';
import TypeSwitchBox from '@/components/server/valheim/TypeSwitchBox';
import useSWR from 'swr';
import { ServerContext } from '@/state/server';
import Spinner from '@/components/elements/Spinner';
import tw from 'twin.macro';
import { Alert } from '@/components/elements/alert';
import ModsSearch from '@/components/server/valheim/ModsSearch';
import loadValheimMods from '@/api/server/valheim/loadValheimMods';
import InstallInProgressBox from '@/components/server/valheim/InstallInProgressBox';

export default () => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [installInProgress, setInstallInProgress] = useState(false);

    const { clearFlashes, clearAndAddHttpError } = useFlashKey('server:valheim');
    const { data, error, mutate } = useSWR([uuid, '/valheim'], (uuid) => loadValheimMods(uuid), {
        refreshInterval: 15000, // set refresh interval to 15 sec
    });

    useEffect(() => {
        if (data) {
            data.installing === undefined ? setInstallInProgress(false) : setInstallInProgress(true);
        }
    }, [data]);

    useEffect(() => {
        if (!error) {
            clearFlashes();
        } else {
            clearAndAddHttpError(error);
        }
    }, [error]);

    return (
        <ServerContentBlock title={'Valheim Mods'} showFlashKey={'server:valheim'}>
            {!data && !error && <Spinner size={'large'} centered />}
            {data && (
                <>
                    <TypeSwitchBox data={data} onModeSwitched={() => mutate()} />
                    {installInProgress && data.installing !== undefined && (
                        <InstallInProgressBox mod={data.installing} installingStatus={data.installingStatus} onRefresh={() => mutate()} />
                    )}
                    {data.mode === 'vanilla' && (
                        <Alert type={'warning'} css={tw`w-full mt-4`}>
                            Please switch to Valheim BepInEx to manage server mods and modpacks. Mods and modpacks are loaded from&nbsp;
                            <a target={'_blank'} rel={'noreferrer'} href={'https://thunderstore.io'}>
                                thunderstore.io
                            </a>
                            .
                        </Alert>
                    )}
                    <ModsSearch disabled={data.mode === 'vanilla'} onUpdate={() => mutate()} />
                </>
            )}
        </ServerContentBlock>
    );
};

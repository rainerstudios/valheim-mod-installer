import React, { useState } from 'react';
import { IValheimMod } from '@/api/server/valheim/fetchMods';
import tw from 'twin.macro';
import Spinner from '@/components/elements/Spinner';
import { ExclamationIcon, ShieldExclamationIcon } from '@heroicons/react/outline';
import Button from '@/components/elements/button/Button';
import cancelModInstall from '@/api/server/valheim/cancelModInstall';
import { ServerContext } from '@/state/server';
import useFlash, { useFlashKey } from '@/plugins/useFlash';

interface Props {
    mod: IValheimMod;
    installingStatus: undefined | 'failed' | 'downloading';
    onRefresh: () => void;
}

export default ({ mod, installingStatus, onRefresh }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [cancelling, setCancelling] = useState(false);

    const { addFlash } = useFlash();
    const { clearAndAddHttpError, clearFlashes } = useFlashKey('server:valheim');

    const cancelInstall = () => {
        clearFlashes();
        setCancelling(true);

        cancelModInstall(uuid)
            .then(() => {
                addFlash({ key: 'server:valheim', type: 'success', title: 'success', message: 'Mod install process is successfully cancelled.' });
                onRefresh();
            })
            .catch((error) => {
                setCancelling(false);
                clearAndAddHttpError(error);
            });
    };

    return (
        <div css={tw`bg-gray-600 border-gray-700 border-2 rounded-lg mt-4 p-2`}>
            <div css={tw`flex gap-4 items-center`}>
                {installingStatus === 'failed' ? (
                    <ShieldExclamationIcon className={'w-12 h-12 text-red-500 ml-8 mr-4'} />
                ) : (
                    <ExclamationIcon className={'w-12 h-12 text-yellow-500 ml-8 mr-4'} />
                )}
                <div css={tw`flex-1`}>
                    <div css={tw`font-bold`}>
                        {mod.name} {mod.versions[0].versionNumber} installing in progress...
                    </div>
                    <div>
                        Current status:{' '}
                        {installingStatus === 'failed' ? (
                            <span css={tw`underline`}>Failed to collect dependencies and call wings for download. Please cancel and try again...</span>
                        ) : installingStatus === 'downloading' ? (
                            <span css={tw`underline`}>Downloading dependencies...</span>
                        ) : (
                            <span css={tw`underline`}>Collecting dependencies...</span>
                        )}
                    </div>
                </div>
                {installingStatus === 'failed' ? (
                    <Button.Danger size={1} onClick={() => cancelInstall()} disabled={cancelling}>
                        Cancel install
                    </Button.Danger>
                ) : (
                    <Spinner size={'base'} css={tw`m-4`} />
                )}
            </div>
        </div>
    );
};

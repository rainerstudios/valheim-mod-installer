import React, { useState } from 'react';
import tw from 'twin.macro';
import { IValheimMod } from '@/api/server/valheim/fetchMods';
import { useFlashKey } from '@/plugins/useFlash';
import { ServerContext } from '@/state/server';
import ConfirmationDialog from '@/components/elements/dialog/ConfirmationDialog';
import FlashMessageRender from '@/components/FlashMessageRender';
import uninstallMod from '@/api/server/valheim/uninstallMod';

interface Props {
    mod: IValheimMod;
    onUpdate: () => void;
    onClose: () => void;
}

export default ({ mod, onUpdate, onClose }: Props) => {
    const uuid = ServerContext.useStoreState((state) => state.server.data!.uuid);

    const [confirmationLoading, setConfirmationLoading] = useState(false);

    const { clearAndAddHttpError, clearFlashes } = useFlashKey('server:valheim:mods:uninstall');

    const startUninstall = () => {
        setConfirmationLoading(true);

        uninstallMod(uuid, mod.uuid4)
            .then(() => {
                onUpdate();
                onClose();
            })
            .catch((error) => {
                clearAndAddHttpError(error);
                setConfirmationLoading(false);
            });
    };

    return (
        <ConfirmationDialog
            title={'Confirm uninstall'}
            open={true}
            onClose={() => {
                onClose();
                clearFlashes();
            }}
            onConfirmed={() => startUninstall()}
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            buttonText={'Uninstall'}
            showSpinnerOverlay={confirmationLoading}
        >
            <FlashMessageRender byKey={'server:valheim:mods:uninstall'} css={tw`mb-2`} />
            Are you sure that you want to start to uninstall{' '}
            <code>
                {mod.name} {mod.versions[0].versionNumber}
            </code>{' '}
            to this server? After you start the uninstallation process, every related mod will be deleted from your server.
        </ConfirmationDialog>
    );
};

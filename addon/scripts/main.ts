import {
    type CustomCommand,
    type CustomCommandResult,
    CommandPermissionLevel,
    CustomCommandParamType,
    CustomCommandOrigin,
    CustomCommandStatus,
    Player,
    system,
    world,
    Entity,
} from '@minecraft/server';

import {
    ActionFormData,
    ModalFormData
} from '@minecraft/server-ui';

const NAME = 'Aerell NPC';
const IDENTIFIER_PREFIX = 'aerell';
const VERSION = '0.28.0';

const NPC = 'npc';

const NPC_COMMAND_NAME = `${IDENTIFIER_PREFIX}:${NPC}`;
const NPC_COMMAND_ENUM_PREFIX_NAME = `${IDENTIFIER_PREFIX}:prefix`;

const NPC_ENTITY_TYPE_ID = NPC_COMMAND_NAME;

const npcCommand: CustomCommand = {
    name: NPC_COMMAND_NAME,
    description: 'Aerell NPC Commands',
    permissionLevel: CommandPermissionLevel.Any,
    cheatsRequired: false,
    mandatoryParameters: [
        {
            name: NPC_COMMAND_ENUM_PREFIX_NAME,
            type: CustomCommandParamType.Enum
        }
    ]
};

const spawnNPC = (player: Player): CustomCommandResult => {
    const dimension = player.dimension;
    const location = player.location;
    try {
        system.run(() => {
            const npc = dimension.spawnEntity(NPC_ENTITY_TYPE_ID, location);
            npc.nameTag = 'Aerell NPC';
        });
        return {
            status: CustomCommandStatus.Success,
            message: '§eThe Aerell NPC has been spawned.'
        };
    } catch (error: any) {
        return {
            status: CustomCommandStatus.Failure,
            message: '§cFailed to spawn Aerell NPC.'
        };
    }
};

const npcCommandCallBack = (origin: CustomCommandOrigin, prefix: string): CustomCommandResult => {
    const source = origin.initiator ?? origin.sourceEntity;

    if (!(source instanceof Player)) return {
        status: CustomCommandStatus.Failure,
        message: 'This command can only be executed by players.'
    };

    if (prefix == 'version') return {
        status: CustomCommandStatus.Success,
        message: `§e${NAME} version ${VERSION}`
    };

    if (prefix == 'spawn') return spawnNPC(source);

    return {
        status: CustomCommandStatus.Failure
    };
};

const showNpcGuiSettings = (npc: Entity, player: Player) => {
    system.run(() => {
        const NPC_PROPERTY_MODEL_ID = 'aerell_npc:model';
        const NPC_PROPERTY_SKIN_ID = 'aerell_npc:skin';
        new ModalFormData()
            .title("Settings")
            .textField(
                'Name',
                'Enter the npc name...',
                {
                    defaultValue: npc.nameTag
                }
            ).slider(
                'Skin',
                0,
                2,
                {
                    defaultValue: npc.getProperty(NPC_PROPERTY_SKIN_ID) as number,
                    valueStep: 1
                }
            ).dropdown(
                'Model',
                [
                    'Classic',
                    'Slim'
                ],
                {
                    defaultValueIndex: npc.getProperty(NPC_PROPERTY_MODEL_ID) as number
                }
            ).show(player).then((value) => {
                if (value.canceled || !value.formValues) return;
                npc.nameTag = value.formValues[0] as string;
                npc.setProperty(NPC_PROPERTY_SKIN_ID, value.formValues[1] as number);
                npc.setProperty(NPC_PROPERTY_MODEL_ID, value.formValues[2] as number);
            });
    });
};

const showNpcGuiMovements = (player: Player) => {
    system.run(() => {
        new ActionFormData()
            .title("Movements")
            .button("Follow")
            .button("Free")
            .button("Stay Here")
            .show(player).then((value) => {
                if (value.canceled) return;

                switch(value.selection) {
                    default:
                        player.sendMessage("§cComing soon feature.");
                        break;
                }
            });
    });
};

const showNpcGuiMain = (npc: Entity, player: Player) => {
    system.run(() => {
        new ActionFormData()
            .title(npc.nameTag)
            .label(`Health: ${npc.getComponent('minecraft:health')?.currentValue}`)
            .button("Settings")
            .button("Movements")
            .show(player).then((value) => {
                if (value.canceled) return;

                switch (value.selection) {
                    case 0:
                        showNpcGuiSettings(npc, player);
                        break;
                    case 1:
                        showNpcGuiMovements(player);
                        break;
                }
            });
    });
};

system.beforeEvents.startup.subscribe((event) => {
    event.customCommandRegistry.registerEnum(NPC_COMMAND_ENUM_PREFIX_NAME, ['version', 'spawn']);
    event.customCommandRegistry.registerCommand(npcCommand, npcCommandCallBack);
});

world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
    const itemStack = event.itemStack;
    const player = event.player;
    const target = event.target;
    if (target.typeId != NPC_ENTITY_TYPE_ID || (itemStack?.typeId ?? '') == 'minecraft:name_tag') return;
    showNpcGuiMain(target, player);
});
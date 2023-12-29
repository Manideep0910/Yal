
chmod -R 0755 ./crypto-config
# Delete existing artifacts
rm -rf ./crypto-config
rm genesis.block mychannel.tx
rm -rf ../../channel-artifacts/*

#Generate Crypto artifactes for organizations
# cryptogen generate --config=./crypto-config.yaml --output=./crypto-config/



# System channel
SYS_CHANNEL="sys-channel"

# channel name defaults to "mychannel"
CHANNEL_NAME="mychannel"

echo $CHANNEL_NAME

# Generate System Genesis block
echo "#######   Generate System Genesis block ##########"
# configtxgen -profile FiveOrdererGenesis -configPath . -channelID $SYS_CHANNEL  -outputBlock /var/hyperledger/orderer/genesis.block

configtxgen --profile FiveOrdererGenesis -configPath . -channelID $SYS_CHANNEL -outputBlock ./channel-artifacts/genesis.block

# configtxgen -profile FiveOrdererGenesis -configPath . -channelID $SYS_CHANNEL  -outputBlock ./genesis.block

# configtxgen -profile OrdererGenesis -configPath . -channelID $SYS_CHANNEL  -outputBlock ./genesis.block

# configtxgen -profile FiveOrdererGenesis -configPath -channelID $SYS_CHANNEL -outputBlock ./composer-genesis.block


# configtxgen -profile FiveOrdererGenesis -configPath . -channelID $SYS_CHANNEL -outputBlock /var/hyperledger/orderer/genesis.block

# configtxgen -profile FiveOrdererGenesis -configPath . -channelID $SYS_CHANNEL -outputBlock /var/hyperledger/orderer/orderer.genesis.block
# configtxgen -profile FiveOrdererGenesis -channelID system-channel -configPath -outputBlock ./channel-artifacts/genesis.block

# configtxgen -profile FiveOrdererGenesis -channelID system-channel -configPath -outputBlock ./system-genesis-block/genesis.block

# Generate channel configuration block
echo "#######    Generating channel configuration block  ##########"
configtxgen -profile BasicChannel -configPath . -outputCreateChannelTx ./mychannel.tx -channelID $CHANNEL_NAME

echo "#######    Generating anchor peer update for Org1MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./Org1MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org1MSP

echo "#######    Generating anchor peer update for Org2MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./Org2MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org2MSP

echo "#######    Generating anchor peer update for Org3MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./Org3MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org3MSP

echo "#######    Generating anchor peer update for Org4MSP  ##########"
configtxgen -profile BasicChannel -configPath . -outputAnchorPeersUpdate ./Org4MSPanchors.tx -channelID $CHANNEL_NAME -asOrg Org4MSP
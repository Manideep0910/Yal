# #!/bin/bash

# # Define the base directory where the setup folders are located
# # BASE_DIR="/path/to/hyperledger-fabric-network"
# BASE_DIR="/home/manideepdevarapalli/Desktop/manideep/FabricMultiHostDeployment/"
# # List of organizations
# ORG_LIST=("org1" "org2" "org3" "org4" "orderer")

# # Function to delete generated folders for an organization
# delete_generated_folders() {
#     local org_name="$1"
#     local org_dir="${BASE_DIR}/setup1/${org_name}"

#     # Delete the generated folders if they exist
#     rm -rf "${org_dir}/crypto-config" 

#     cd "${org_dir}/create-certificate-with-ca"
#     sudo rm -rf "fabric-ca"
#     echo "Deletion of fabric ca folder successful."
#     # push "${org_dir}/create-certificate-with-ca"
#     # rm -rf "/fabric-ca"
# }

# # Loop through each organization and delete generated folders
# for ORG_NAME in "${ORG_LIST[@]}"; do
#     echo "Deleting generated folders for ${ORG_NAME}..."
#     delete_generated_folders "${ORG_NAME}"
# done

# echo "Deletion of generated folders for all organizations completed successfully."


#!/bin/bash

# Define the base directory where the setup folders are located
BASE_DIR="/home/manideepdevarapalli/Desktop/manideep/FabricMultiHostDeployment/"
# List of organizations
ORG_LIST=("org1" "org2" "org3" "org4" "orderer")

# Function to delete generated folders for an organization
delete_generated_folders() {
    local org_name="$1"
    local org_dir="${BASE_DIR}/setup1/${org_name}"

    # Check if crypto-config directory exists before deletion
    if [ -d "${org_dir}/crypto-config" ]; then
        rm -rf "${org_dir}/crypto-config"
        echo "Deletion of crypto-config folder successful."
    else
        echo "Crypto-config folder not found for ${ORG_NAME}. Skipping deletion."
    fi

    # Check if fabric-ca directory exists before deletion
    cd "${org_dir}/create-certificate-with-ca"
    if [ -d "fabric-ca" ]; then
        sudo rm -rf "fabric-ca"
        echo "Deletion of fabric-ca folder successful."
    else
        echo "Fabric-ca folder not found for ${ORG_NAME}. Skipping deletion."
    fi
}

# Loop through each organization and delete generated folders
for ORG_NAME in "${ORG_LIST[@]}"; do
    echo "Deleting generated folders for ${ORG_NAME}..."
    delete_generated_folders "${ORG_NAME}"
done

echo "Deletion of generated folders for all organizations completed successfully."

# #!/bin/bash

# # Define the base directory where your organization setups are located
# BASE_DIR="/home/manideepdevarapalli/Desktop/manideep/FabricMultiHostDeployment/setup1"

# # List of organizations
# ORG_LIST=("org1" "org2" "org3" "org4" "orderer")

# # Loop through each organization and perform the specified steps
# for ORG_NAME in "${ORG_LIST[@]}"; do
#     ORG_DIR="${BASE_DIR}/${ORG_NAME}/create-certificate-with-ca"

#     # Check if the organization directory exists
#     if [ -d "$ORG_DIR" ]; then
#         echo "Setting up certificates for ${ORG_NAME}..."
#      fi
#         # Change to the organization directory
#         cd "$ORG_DIR" || exit

#         # Start the ca_org container
#         docker-compose up -d

#         # Run the certificate creation script
#         ./create-certificate-with-ca.sh

#         # Return to the base directory
#         cd - || exit
#     else
#         echo "Error: Directory not found for ${ORG_NAME}."
#     fi
# done

# echo "Hyperledger Fabric setup completed for all organizations."


# #!/bin/bash

# # Define the base directory
# # BASE_DIR="/path/to/hyperledger-fabric-network"
# BASE_DIR="/home/manideepdevarapalli/Desktop/manideep/FabricMultiHostDeployment/"
# # List of organizations
# ORG_LIST=("org1" "org2" "org3" "org4" "orderer")

# # Loop through each organization and perform the steps
# for ORG_NAME in "${ORG_LIST[@]}"; do
#     ORG_DIR="${BASE_DIR}/setup1/${ORG_NAME}/create-certificate-with-ca"

#     # Check if the organization directory exists
#     if [ -d "$ORG_DIR" ]; then
#         echo "Setting up organization ${ORG_NAME}..."

#         # Step 1: Start ca_org container
#         echo "Step 1: Starting ca_${ORG_NAME} container..."
#         cd "${ORG_DIR}"
#         docker-compose up -d

#         # Step 2: Run create-certificate-with-ca.sh
#         echo "Step 2: Running create-certificate-with-ca.sh for ${ORG_NAME}..."
#         ./create-certificate-with-ca.sh

#         echo "Organization ${ORG_NAME} setup completed."
#     else
#         echo "Error: Directory not found for ${ORG_NAME}."
#     fi
# done

# echo "Setup for all organizations completed successfully."


#!/bin/bash

# Define the base directory
BASE_DIR="/home/manideepdevarapalli/Desktop/manideep/FabricMultiHostDeployment"
# List of organizations
ORG_LIST=("org1")

# Loop through each organization and perform the steps
for ORG_NAME in "${ORG_LIST[@]}"; do
    ORG_DIR="${BASE_DIR}/setup1/${ORG_NAME}/create-certificate-with-ca"

    # Check if the organization directory exists
    if [ -d "$ORG_DIR" ]; then
        echo "Setting up organization ${ORG_NAME}..."

        # Step 1: Start ca_org container
        echo "Step 1: Starting ca_${ORG_NAME} container..."
        cd "${ORG_DIR}" && docker-compose up -d || { echo "Error starting containers for ${ORG_NAME}"; exit 1; }

        # Step 2: Run create-certificate-with-ca.sh
        echo "Step 2: Running create-certificate-with-ca.sh for ${ORG_NAME}..."
        ./create-certificate-with-ca.sh || { echo "Error running script for ${ORG_NAME}"; exit 1; }

        echo "Organization ${ORG_NAME} setup completed."
    else
        echo "Error: Directory not found for ${ORG_NAME}."
    fi
done

echo "Setup for all organizations completed successfully."






# Loop through each organization and perform the steps
# for ORG_NAME in "${ORG_LIST[@]}"; do
#     ORG_DIR="${BASE_DIR}/setup1/${ORG_NAME}/create-certificate-with-ca"

#     # Check if the organization directory exists
#     if [ -d "$ORG_DIR" ]; then
#         echo "Setting up certificates for ${ORG_NAME}..."
#         cd "$ORG_DIR"

#         # Start the ca_orgX container
#         docker-compose up -d

#         # Run the certificate creation script
#         ./create-certificate-with-ca.sh

#         # Return to the base directory
#         cd "$BASE_DIR"
#     else
#         echo "Error: Directory not found for ${ORG_NAME}."
#     fi
# done

# echo "Certificate setup completed for all organizations."



#     # Step 2: Check if the script exists and is executable
#     SCRIPT="./create-certificate-with-ca.sh"
#       if [ -x "$SCRIPT" ]; then
#     # Step 3: Run create-certificate-with-ca.sh
#        echo "Step 3: Running ${SCRIPT} for ${ORG_NAME}..."
#         ./${SCRIPT}
#        echo "Organization ${ORG_NAME} setup completed."
#       else
#         echo "Error: ${SCRIPT} not found or not executable for ${ORG_NAME}."
# fi

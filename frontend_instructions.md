# Frontend Implementation Guide: User Profile & Address Management

## Context
The backend has been updated to support User Profile (Phone) and Address Management. The persistence issues have been resolved. The backend now guarantees `phone` and `addresses` fields in the user object.

## API Contract (Updated)

### 1. User Types
Update your frontend `User` interface to match this structure:
```typescript
interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone: string; // Now available (default "" if empty)
  addresses: Address[]; // Now available (default [] if empty)
}
```

### 2. Endpoints

#### Update Profile (Name & Phone only)
*   **Method**: `PUT`
*   **URL**: `/api/users/profile`
*   **Payload**:
    ```json
    {
      "name": "Jane Doe",
      "phone": "+1234567890" // Key must be "phone", NOT "phoneNumber"
    }
    ```

#### Add New Address
*   **Method**: `POST`
*   **URL**: `/api/users/address`
*   **Payload**:
    ```json
    {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA",
      "isDefault": true
    }
    ```

#### Update Address
*   **Method**: `PUT`
*   **URL**: `/api/users/address/:addressId`
*   **Payload**: (Any partial address fields)

#### Delete Address
*   **Method**: `DELETE`
*   **URL**: `/api/users/address/:addressId`

## Critical Implementation Notes for Frontend Developer

1.  **Field Naming**: Ensure you send `phone` (not `mobile`) in the body for profile updates.
2.  **Separate Concerns**: Do NOT try to update addresses via the `/profile` endpoint. Use the dedicated `/address` endpoints.
3.  **Redux/State Update**:
    *   On `LOGIN_SUCCESS`, ensure the reducer saves the *entire* `payload.user` object (which now includes `phone` and `addresses`).
    *   On `UPDATE_PROFILE_SUCCESS`, merge the returned data into the store.
    *   On `ADD_ADDRESS_SUCCESS`, add the returned address to `state.user.addresses`.
4.  **Verification**: Check the Network tab. The Login response will definitely contain `phone` and `addresses`. If the UI is not showing them, check the component prop drilling or state selectors.

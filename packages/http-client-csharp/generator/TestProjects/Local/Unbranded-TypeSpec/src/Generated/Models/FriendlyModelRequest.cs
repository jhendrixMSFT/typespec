// <auto-generated/>

#nullable disable

using System;
using System.Collections.Generic;

namespace UnbrandedTypeSpec.Models
{
    /// <summary> The FriendlyModelRequest. </summary>
    internal partial class FriendlyModelRequest
    {
        /// <summary> Keeps track of any properties unknown to the library. </summary>
        private IDictionary<string, BinaryData> _serializedAdditionalRawData;

        internal FriendlyModelRequest(string name)
        {
            Name = name;
        }

        internal FriendlyModelRequest(string name, IDictionary<string, BinaryData> serializedAdditionalRawData)
        {
            Name = name;
            _serializedAdditionalRawData = serializedAdditionalRawData;
        }

        /// <summary> name of the NotFriend. </summary>
        public string Name { get; set; }
    }
}
